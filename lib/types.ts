export const NODE_TYPES = [
  "Founder",
  "Investor",
  "Customer",
  "Meeting",
  "Feature",
  "Decision",
  "Objection",
  "Risk",
  "FollowUp",
  "Theme",
  "Source",
] as const;

export const RELATIONSHIP_TYPES = [
  "MENTIONED_IN",
  "RAISED_BY",
  "BLOCKED_BY",
  "CAUSED_BY",
  "DECIDED_IN",
  "PRIORITIZED_BECAUSE",
  "FOLLOWED_UP_ON",
  "RELATED_TO",
  "REPEATED_IN",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface MemoryEntity {
  id?: string;
  type: NodeType;
  name: string;
  summary: string;
  confidence: number;
  rawEvidence?: string;
}

export interface MemoryRelationship {
  sourceName: string;
  sourceType: NodeType;
  targetName: string;
  targetType: NodeType;
  type: RelationshipType;
  evidence: string;
  confidence: number;
}

export interface ExtractionResult {
  title: string;
  summary: string;
  entities: MemoryEntity[];
  relationships: MemoryRelationship[];
  decisions: string[];
  risks: string[];
  followUps: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  summary?: string;
  confidence?: number;
  evidenceCount?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  evidence?: string;
  confidence?: number;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  mode: "neo4j" | "demo";
}

export interface InsightItem {
  id: string;
  title: string;
  type: NodeType | "Insight";
  count: number;
  summary: string;
  evidence: string[];
}

export interface InsightPayload {
  blockers: InsightItem[];
  investorConcerns: InsightItem[];
  roadmapPressure: InsightItem[];
  followUps: InsightItem[];
  mode: "neo4j" | "demo";
}

export interface AtlasSkill {
  id: string;
  name: string;
  lens: string;
  description: string;
  extractionFocus: string[];
  queryStrategy: string;
  answerStyle: string;
  dashboardPriority: string[];
  systemPrompt: string;
  filePath: string;
  rawMarkdown: string;
}

export interface QueryEvidence {
  node: string;
  type: NodeType;
  relationship?: RelationshipType;
  neighbor?: string;
  evidence: string;
}

export interface QueryResult {
  answer: string;
  evidence: QueryEvidence[];
  nextActions: string[];
  cypherSummary: string;
  mode: "neo4j" | "demo";
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
