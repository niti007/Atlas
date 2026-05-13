import neo4j, { type Driver } from "neo4j-driver";
import type { ExtractionResult, GraphEdge, GraphNode, GraphPayload, InsightItem, InsightPayload, NodeType, QueryEvidence, RelationshipType } from "@/lib/types";
import { demoGraph } from "@/lib/demo-data";
import { getDemoEvidence, getDemoGraph, getDemoInsights } from "@/lib/demo-store";
import { extractKeywords, sourceIdFromText, stableId } from "@/lib/local-extractor";

let driver: Driver | null = null;

export function neo4jConfigured(): boolean {
  return Boolean(process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD);
}

export function getNeo4jDriver(): Driver {
  if (!neo4jConfigured()) {
    throw new Error("Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.");
  }

  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
      { disableLosslessIntegers: true },
    );
  }

  return driver;
}

export async function verifyNeo4j(): Promise<boolean> {
  if (!neo4jConfigured()) return false;
  await getNeo4jDriver().verifyConnectivity();
  return true;
}

export async function initSchema(): Promise<void> {
  if (!neo4jConfigured()) return;
  const session = getNeo4jDriver().session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    await session.run("CREATE CONSTRAINT atlas_memory_entity_id IF NOT EXISTS FOR (n:MemoryEntity) REQUIRE n.id IS UNIQUE");
    await session.run("CREATE CONSTRAINT atlas_source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.id IS UNIQUE");
  } finally {
    await session.close();
  }
}

export async function storeExtraction(text: string, extraction: ExtractionResult, skillId: string): Promise<{ sourceId: string; entityCount: number; relationshipCount: number }> {
  await initSchema();

  const sourceId = sourceIdFromText(text);
  const now = new Date().toISOString();
  const entityParams = extraction.entities.map((entity) => ({
    id: stableId(entity.type, entity.name),
    type: entity.type,
    name: entity.name,
    summary: entity.summary,
    confidence: entity.confidence,
    rawEvidence: entity.rawEvidence || entity.summary,
  }));

  const session = getNeo4jDriver().session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        MERGE (s:Source {id: $sourceId})
        SET s.title = $title,
            s.summary = $summary,
            s.text = $text,
            s.skillId = $skillId,
            s.updatedAt = $now
        ON CREATE SET s.createdAt = $now
        `,
        { sourceId, title: extraction.title, summary: extraction.summary, text, skillId, now },
      );

      for (const entity of entityParams) {
        await tx.run(
          `
          MERGE (n:MemoryEntity {id: $id})
          SET n.type = $type,
              n.name = $name,
              n.summary = $summary,
              n.confidence = CASE WHEN coalesce(n.confidence, 0) > $confidence THEN n.confidence ELSE $confidence END,
              n.updatedAt = $now
          ON CREATE SET n.createdAt = $now
          WITH n
          MATCH (s:Source {id: $sourceId})
          MERGE (n)-[r:MENTIONED_IN]->(s)
          SET r.evidence = $rawEvidence,
              r.confidence = $confidence,
              r.updatedAt = $now
          `,
          { ...entity, sourceId, now },
        );
      }

      for (const relationship of extraction.relationships) {
        const sourceEntity = entityParams.find((entity) => entity.name.toLowerCase() === relationship.sourceName.toLowerCase() && entity.type === relationship.sourceType);
        const targetEntity = entityParams.find((entity) => entity.name.toLowerCase() === relationship.targetName.toLowerCase() && entity.type === relationship.targetType);
        if (!sourceEntity || !targetEntity) continue;

        await tx.run(
          `
          MATCH (a:MemoryEntity {id: $sourceId})
          MATCH (b:MemoryEntity {id: $targetId})
          MERGE (a)-[r:${relationship.type}]->(b)
          SET r.evidence = $evidence,
              r.confidence = $confidence,
              r.skillId = $skillId,
              r.updatedAt = $now
          ON CREATE SET r.createdAt = $now
          `,
          {
            sourceId: sourceEntity.id,
            targetId: targetEntity.id,
            evidence: relationship.evidence,
            confidence: relationship.confidence,
            skillId,
            now,
          },
        );
      }
    });

    return {
      sourceId,
      entityCount: entityParams.length,
      relationshipCount: extraction.relationships.length,
    };
  } finally {
    await session.close();
  }
}

export async function getGraph(): Promise<GraphPayload> {
  if (!neo4jConfigured()) return getDemoGraph();

  const session = getNeo4jDriver().session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    const result = await session.run(
      `
      MATCH (n)
      WHERE n:MemoryEntity OR n:Source
      OPTIONAL MATCH (n)-[r]-(m)
      WHERE m:MemoryEntity OR m:Source
      RETURN n, count(r) AS degree
      ORDER BY degree DESC, coalesce(n.updatedAt, n.createdAt) DESC
      LIMIT 40
      `,
    );

    const nodes: GraphNode[] = result.records.map((record) => {
      const node = record.get("n");
      const props = node.properties;
      return {
        id: String(props.id),
        label: String(props.name || props.title || "Source"),
        type: (node.labels.includes("Source") ? "Source" : props.type || "Theme") as NodeType,
        summary: props.summary,
        confidence: props.confidence,
        evidenceCount: Number(record.get("degree") || 0),
      };
    });

    const ids = nodes.map((node) => node.id);
    if (!ids.length) return { ...demoGraph, mode: "demo" };

    const edgeResult = await session.run(
      `
      MATCH (a)-[r]->(b)
      WHERE (a:MemoryEntity OR a:Source)
        AND (b:MemoryEntity OR b:Source)
        AND a.id IN $ids
        AND b.id IN $ids
      RETURN a.id AS source, b.id AS target, type(r) AS type, r.evidence AS evidence, r.confidence AS confidence
      LIMIT 80
      `,
      { ids },
    );

    const edges: GraphEdge[] = edgeResult.records.map((record, index) => ({
      id: `edge-${index}-${record.get("source")}-${record.get("target")}`,
      source: String(record.get("source")),
      target: String(record.get("target")),
      type: record.get("type") as RelationshipType,
      evidence: record.get("evidence") || undefined,
      confidence: record.get("confidence") || undefined,
    }));

    return { nodes, edges, mode: "neo4j" };
  } finally {
    await session.close();
  }
}

export async function getInsights(): Promise<InsightPayload> {
  if (!neo4jConfigured()) return getDemoInsights();

  const session = getNeo4jDriver().session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    const [blockers, investorConcerns, roadmapPressure, followUps] = await Promise.all([
      insightQuery(
        session,
        `
        MATCH (a:MemoryEntity)-[r]->(b:MemoryEntity)
        WHERE type(r) IN ['BLOCKED_BY', 'CAUSED_BY', 'RAISED_BY']
          AND b.type IN ['Risk', 'Objection', 'Feature']
        RETURN b.id AS id, b.name AS title, b.type AS type, b.summary AS summary, count(r) AS count, collect(distinct coalesce(r.evidence, a.name))[0..4] AS evidence
        ORDER BY count DESC
        LIMIT 5
        `,
      ),
      insightQuery(
        session,
        `
        MATCH (a:MemoryEntity)-[r]-(b:MemoryEntity)
        WHERE a.type = 'Investor' OR b.type = 'Investor'
        WITH CASE WHEN a.type = 'Investor' THEN a ELSE b END AS investor, r, CASE WHEN a.type = 'Investor' THEN b ELSE a END AS other
        RETURN investor.id AS id, investor.name AS title, investor.type AS type, investor.summary AS summary, count(r) AS count, collect(distinct coalesce(r.evidence, other.name))[0..4] AS evidence
        ORDER BY count DESC
        LIMIT 5
        `,
      ),
      insightQuery(
        session,
        `
        MATCH (n:MemoryEntity)
        WHERE n.type IN ['Feature', 'Decision']
        OPTIONAL MATCH (n)-[r]-(m:MemoryEntity)
        RETURN n.id AS id, n.name AS title, n.type AS type, n.summary AS summary, count(r) AS count, collect(distinct coalesce(r.evidence, m.name))[0..4] AS evidence
        ORDER BY count DESC
        LIMIT 5
        `,
      ),
      insightQuery(
        session,
        `
        MATCH (n:MemoryEntity)
        WHERE n.type = 'FollowUp'
        OPTIONAL MATCH (n)-[r]-(m:MemoryEntity)
        RETURN n.id AS id, n.name AS title, n.type AS type, n.summary AS summary, count(r) AS count, collect(distinct coalesce(r.evidence, m.name))[0..4] AS evidence
        ORDER BY count DESC
        LIMIT 5
        `,
      ),
    ]);

    return { blockers, investorConcerns, roadmapPressure, followUps, mode: "neo4j" };
  } finally {
    await session.close();
  }
}

export async function getQueryEvidence(question: string): Promise<{ evidence: QueryEvidence[]; mode: "neo4j" | "demo" }> {
  if (!neo4jConfigured()) {
    return {
      mode: "demo",
      evidence: getDemoEvidence(),
    };
  }

  const terms = extractKeywords(question);
  const session = getNeo4jDriver().session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    const result = await session.run(
      `
      MATCH (n:MemoryEntity)
      WHERE size($terms) = 0
        OR any(term IN $terms WHERE toLower(n.name) CONTAINS term OR toLower(coalesce(n.summary, '')) CONTAINS term)
      OPTIONAL MATCH (n)-[r]-(m:MemoryEntity)
      RETURN n.name AS node,
             n.type AS type,
             type(r) AS relationship,
             m.name AS neighbor,
             coalesce(r.evidence, n.summary) AS evidence,
             count(r) AS degree
      ORDER BY degree DESC
      LIMIT 14
      `,
      { terms },
    );

    let records = result.records;
    if (!records.length) {
      const fallback = await session.run(
        `
        MATCH (n:MemoryEntity)
        OPTIONAL MATCH (n)-[r]-(m:MemoryEntity)
        RETURN n.name AS node,
               n.type AS type,
               type(r) AS relationship,
               m.name AS neighbor,
               coalesce(r.evidence, n.summary) AS evidence,
               count(r) AS degree
        ORDER BY degree DESC
        LIMIT 14
        `,
      );
      records = fallback.records;
    }

    return {
      mode: "neo4j",
      evidence: records.map((record) => ({
        node: String(record.get("node")),
        type: String(record.get("type") || "Theme") as NodeType,
        relationship: (record.get("relationship") || undefined) as RelationshipType | undefined,
        neighbor: record.get("neighbor") || undefined,
        evidence: String(record.get("evidence") || "Graph node matched the question."),
      })),
    };
  } finally {
    await session.close();
  }
}

async function insightQuery(session: ReturnType<Driver["session"]>, cypher: string): Promise<InsightItem[]> {
  const result = await session.run(cypher);
  return result.records.map((record) => ({
    id: String(record.get("id")),
    title: String(record.get("title")),
    type: String(record.get("type") || "Insight") as InsightItem["type"],
    count: Number(record.get("count") || 0),
    summary: String(record.get("summary") || "Graph insight from company memory."),
    evidence: record.get("evidence") || [],
  }));
}
