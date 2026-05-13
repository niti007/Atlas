import type { ExtractionResult, GraphPayload, InsightPayload, QueryEvidence } from "@/lib/types";
import { demoGraph, demoInsights } from "@/lib/demo-data";
import { sourceIdFromText, stableId } from "@/lib/local-extractor";

type DemoState = {
  graph: GraphPayload;
  insights: InsightPayload;
};

declare global {
  // eslint-disable-next-line no-var
  var __atlasDemoState: DemoState | undefined;
}

function state(): DemoState {
  if (!globalThis.__atlasDemoState) {
    globalThis.__atlasDemoState = {
      graph: structuredClone(demoGraph),
      insights: structuredClone(demoInsights),
    };
  }
  return globalThis.__atlasDemoState;
}

export function getDemoGraph(): GraphPayload {
  return state().graph;
}

export function getDemoInsights(): InsightPayload {
  return state().insights;
}

export function storeDemoExtraction(text: string, extraction: ExtractionResult): { sourceId: string; entityCount: number; relationshipCount: number } {
  const current = state();
  const sourceId = sourceIdFromText(text);
  const sourceNode = {
    id: sourceId,
    label: extraction.title,
    type: "Source" as const,
    summary: extraction.summary,
    evidenceCount: extraction.entities.length,
  };

  const nodes = new Map(current.graph.nodes.map((node) => [node.id, node]));
  nodes.set(sourceNode.id, sourceNode);

  for (const entity of extraction.entities) {
    const id = stableId(entity.type, entity.name);
    nodes.set(id, {
      id,
      label: entity.name,
      type: entity.type,
      summary: entity.summary,
      confidence: entity.confidence,
      evidenceCount: (nodes.get(id)?.evidenceCount || 0) + 1,
    });
  }

  const edges = [...current.graph.edges];
  for (const entity of extraction.entities) {
    const id = stableId(entity.type, entity.name);
    edges.push({
      id: `${id}-${sourceId}`,
      source: id,
      target: sourceId,
      type: "MENTIONED_IN",
      evidence: entity.rawEvidence || entity.summary,
      confidence: entity.confidence,
    });
  }

  for (const relationship of extraction.relationships) {
    const source = stableId(relationship.sourceType, relationship.sourceName);
    const target = stableId(relationship.targetType, relationship.targetName);
    edges.push({
      id: `${source}-${relationship.type}-${target}`,
      source,
      target,
      type: relationship.type,
      evidence: relationship.evidence,
      confidence: relationship.confidence,
    });
  }

  current.graph = {
    mode: "demo",
    nodes: Array.from(nodes.values()).slice(-60),
    edges: dedupeEdges(edges).slice(-120),
  };
  current.insights = buildInsights(current.graph, extraction);

  return { sourceId, entityCount: extraction.entities.length, relationshipCount: extraction.relationships.length };
}

function dedupeEdges(edges: GraphPayload["edges"]): GraphPayload["edges"] {
  const byKey = new Map<string, GraphPayload["edges"][number]>();
  for (const edge of edges) {
    byKey.set(`${edge.source}:${edge.type}:${edge.target}:${edge.evidence || ""}`, edge);
  }
  return Array.from(byKey.values());
}

export function getDemoEvidence(): QueryEvidence[] {
  const graph = getDemoGraph();
  return graph.edges
    .filter((edge) => edge.type !== "MENTIONED_IN")
    .slice(-12)
    .reverse()
    .map((edge) => {
      const source = graph.nodes.find((node) => node.id === edge.source);
      const target = graph.nodes.find((node) => node.id === edge.target);
      return {
        node: source?.label || edge.source,
        type: source?.type || "Theme",
        relationship: edge.type,
        neighbor: target?.label || edge.target,
        evidence: edge.evidence || "Demo graph relationship.",
      };
    });
}

function buildInsights(graph: GraphPayload, extraction: ExtractionResult): InsightPayload {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const relatedCount = new Map<string, number>();
  const evidence = new Map<string, string[]>();

  for (const edge of graph.edges) {
    relatedCount.set(edge.source, (relatedCount.get(edge.source) || 0) + 1);
    relatedCount.set(edge.target, (relatedCount.get(edge.target) || 0) + 1);
    for (const id of [edge.source, edge.target]) {
      const list = evidence.get(id) || [];
      if (edge.evidence && list.length < 4) list.push(edge.evidence);
      evidence.set(id, list);
    }
  }

  const toInsight = (types: string[]) =>
    graph.nodes
      .filter((node) => types.includes(node.type))
      .sort((a, b) => (relatedCount.get(b.id) || 0) - (relatedCount.get(a.id) || 0))
      .slice(0, 5)
      .map((node) => ({
        id: node.id,
        title: node.label,
        type: node.type,
        count: relatedCount.get(node.id) || 1,
        summary: node.summary || "Graph insight from company memory.",
        evidence: evidence.get(node.id) || [node.summary || "Mentioned in current memory."],
      }));

  return {
    mode: "demo",
    blockers: toInsight(["Risk", "Objection"]),
    investorConcerns: toInsight(["Investor"]),
    roadmapPressure: toInsight(["Feature", "Decision"]),
    followUps: toInsight(["FollowUp"]).concat(
      extraction.followUps.slice(0, 2).map((followUp, index) => ({
        id: `follow-up-${index}`,
        title: followUp.slice(0, 80),
        type: "FollowUp" as const,
        count: 1,
        summary: followUp,
        evidence: [followUp],
      })),
    ),
  };
}
