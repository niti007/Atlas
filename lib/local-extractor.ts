import crypto from "crypto";
import { NODE_TYPES, RELATIONSHIP_TYPES, type ExtractionResult, type MemoryEntity, type NodeType, type RelationshipType } from "@/lib/types";

const ENTITY_HINTS: Record<NodeType, RegExp[]> = {
  Founder: [/\bfounder(?:s| team)?\b/i],
  Investor: [/\bventures\b/i, /\binvestor(?:s)?\b/i, /\bcapital\b/i],
  Customer: [/\bbank\b/i, /\bhealth\b/i, /\bcustomer(?:s)?\b/i, /\bprospect(?:s)?\b/i],
  Meeting: [/\bmeeting\b/i, /\breview\b/i, /\bcall\b/i],
  Feature: [/\bSSO\b/i, /\bRBAC\b/i, /\baudit log\b/i, /\bdashboard\b/i, /\bfeature\b/i],
  Decision: [/\bdecided\b/i, /\bagreed\b/i, /\bprioriti[sz]e\b/i],
  Objection: [/\bblocked\b/i, /\bobjection\b/i, /\bconcern(?:s)?\b/i, /\bneeds\b/i],
  Risk: [/\brisk\b/i, /\bsecurity\b/i, /\bSOC2\b/i, /\bretention\b/i],
  FollowUp: [/\bfollow up\b/i, /\bnext Tuesday\b/i, /\baction item\b/i],
  Theme: [/\brepeatable\b/i, /\benterprise\b/i, /\btrust\b/i],
  Source: [],
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "they",
  "their",
  "about",
  "because",
  "before",
  "after",
  "into",
  "over",
  "next",
  "current",
]);

export function stableId(type: string, name: string): string {
  const normalized = `${type}:${name}`.toLowerCase().replace(/\s+/g, " ").trim();
  return `${type.toLowerCase()}-${crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 12)}`;
}

export function sourceIdFromText(text: string): string {
  return `source-${crypto.createHash("sha1").update(text).digest("hex").slice(0, 14)}`;
}

export function normalizeName(value: string): string {
  return value
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((term) => term.length > 3 && !STOP_WORDS.has(term)),
    ),
  ).slice(0, 12);
}

export function sanitizeNodeType(type: string): NodeType {
  return NODE_TYPES.includes(type as NodeType) ? (type as NodeType) : "Theme";
}

export function sanitizeRelationshipType(type: string): RelationshipType {
  const normalized = type.toUpperCase().replace(/[^A-Z_]/g, "_");
  return RELATIONSHIP_TYPES.includes(normalized as RelationshipType) ? (normalized as RelationshipType) : "RELATED_TO";
}

export function normalizeExtraction(input: unknown): ExtractionResult {
  const raw = input as Partial<ExtractionResult>;
  const entities = Array.isArray(raw.entities) ? raw.entities : [];
  const relationships = Array.isArray(raw.relationships) ? raw.relationships : [];

  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Untitled memory",
    summary: typeof raw.summary === "string" && raw.summary.trim() ? raw.summary.trim() : "Startup memory extracted from notes.",
    entities: dedupeEntities(
      entities
        .map((entity) => ({
          type: sanitizeNodeType(String(entity.type || "Theme")),
          name: normalizeName(String(entity.name || "")),
          summary: String(entity.summary || "Mentioned in source notes.").trim(),
          confidence: clampConfidence(Number(entity.confidence || 0.7)),
          rawEvidence: typeof entity.rawEvidence === "string" ? entity.rawEvidence : undefined,
        }))
        .filter((entity) => entity.name.length > 1),
    ),
    relationships: relationships
      .map((relationship) => ({
        sourceName: normalizeName(String(relationship.sourceName || "")),
        sourceType: sanitizeNodeType(String(relationship.sourceType || "Theme")),
        targetName: normalizeName(String(relationship.targetName || "")),
        targetType: sanitizeNodeType(String(relationship.targetType || "Theme")),
        type: sanitizeRelationshipType(String(relationship.type || "RELATED_TO")),
        evidence: String(relationship.evidence || "Relationship inferred from source notes.").trim(),
        confidence: clampConfidence(Number(relationship.confidence || 0.65)),
      }))
      .filter((relationship) => relationship.sourceName && relationship.targetName && relationship.sourceName !== relationship.targetName),
    decisions: Array.isArray(raw.decisions) ? raw.decisions.map(String).filter(Boolean).slice(0, 8) : [],
    risks: Array.isArray(raw.risks) ? raw.risks.map(String).filter(Boolean).slice(0, 8) : [],
    followUps: Array.isArray(raw.followUps) ? raw.followUps.map(String).filter(Boolean).slice(0, 8) : [],
  };
}

export function localExtract(text: string): ExtractionResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);

  const entities: MemoryEntity[] = [];
  const relationshipCandidates: ExtractionResult["relationships"] = [];

  for (const line of lines) {
    const names = findNamedThings(line);
    const inferredTypes = inferTypes(line);

    for (const name of names) {
      const type = pickType(name, line, inferredTypes);
      entities.push({
        type,
        name,
        summary: line,
        confidence: 0.62,
        rawEvidence: line,
      });
    }

    if (/soc2/i.test(line)) {
      entities.push({ type: "Risk", name: "SOC2 incomplete", summary: line, confidence: 0.78, rawEvidence: line });
    }
    if (/audit log/i.test(line)) {
      entities.push({ type: "Objection", name: "Audit log required", summary: line, confidence: 0.75, rawEvidence: line });
    }
    if (/\bSSO\b|role-based|RBAC/i.test(line)) {
      entities.push({ type: "Feature", name: "SSO and RBAC", summary: line, confidence: 0.74, rawEvidence: line });
    }
    if (/follow up/i.test(line)) {
      entities.push({ type: "FollowUp", name: shortLabel(line), summary: line, confidence: 0.7, rawEvidence: line });
    }
  }

  const normalizedEntities = dedupeEntities(entities);
  for (const line of lines) {
    const related = normalizedEntities.filter((entity) => line.toLowerCase().includes(entity.name.toLowerCase().split(" ")[0]));
    const risk = normalizedEntities.find((entity) => entity.type === "Risk" && line.toLowerCase().includes("soc2"));
    const feature = normalizedEntities.find((entity) => entity.type === "Feature" && /sso|role-based|rbac/i.test(line));
    const objection = normalizedEntities.find((entity) => entity.type === "Objection" && /audit log/i.test(line));
    const primary = related.find((entity) => entity.type === "Customer" || entity.type === "Investor") || related[0];
    const target = risk || feature || objection;

    if (primary && target && primary.name !== target.name) {
      relationshipCandidates.push({
        sourceName: primary.name,
        sourceType: primary.type,
        targetName: target.name,
        targetType: target.type,
        type: /asked|concern|investor/i.test(line) ? "RAISED_BY" : "BLOCKED_BY",
        evidence: line,
        confidence: 0.68,
      });
    }
  }

  return normalizeExtraction({
    title: "Startup memory import",
    summary: summarizeText(text),
    entities: normalizedEntities,
    relationships: relationshipCandidates,
    decisions: lines.filter((line) => /decided|agreed|prioriti/i.test(line)).slice(0, 6),
    risks: lines.filter((line) => /risk|security|soc2|retention|blocked/i.test(line)).slice(0, 6),
    followUps: lines.filter((line) => /follow up|next Tuesday|action item/i.test(line)).slice(0, 6),
  });
}

function inferTypes(line: string): NodeType[] {
  return Object.entries(ENTITY_HINTS)
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(line)))
    .map(([type]) => type as NodeType);
}

function pickType(name: string, line: string, inferredTypes: NodeType[]): NodeType {
  if (/^SOC2$/i.test(name)) return "Risk";
  if (/^SSO$|^RBAC$/i.test(name)) return "Feature";
  if (/ventures|capital|investor/i.test(name) || /investor/i.test(line)) return "Investor";
  if (/bank|health|customer|prospect/i.test(name) || /customer|prospect|pilot|rollout/i.test(line)) return "Customer";
  if (/founder/i.test(name)) return "Founder";
  return inferredTypes.find((type) => type !== "Objection" && type !== "Risk") || "Theme";
}

function findNamedThings(line: string): string[] {
  const matches = line.match(/\b[A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*){0,2}\b/g) || [];
  return matches
    .map(normalizeName)
    .filter(
      (name) =>
        name.length > 2 &&
        !["April", "Product", "Current", "Follow", "Step", "Atlas", "Neo4j", "Tessl", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(name),
    )
    .slice(0, 4);
}

function shortLabel(line: string): string {
  const followUpMatch = line.match(/follow up with\s+(.+?)(?:\s+next\b|\.|$)/i);
  if (followUpMatch?.[1]) return normalizeName(followUpMatch[1]).slice(0, 64);
  return normalizeName(line).slice(0, 64);
}

function summarizeText(text: string): string {
  const first = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .find((line) => line.length > 30);
  return first || "Founder memory extracted from notes.";
}

function dedupeEntities(entities: MemoryEntity[]): MemoryEntity[] {
  const byKey = new Map<string, MemoryEntity>();
  for (const entity of entities) {
    const key = `${entity.type}:${entity.name.toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing || entity.confidence > existing.confidence) {
      byKey.set(key, entity);
    }
  }
  return Array.from(byKey.values()).slice(0, 40);
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0.6;
  return Math.max(0.1, Math.min(1, value));
}
