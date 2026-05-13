import type { AtlasSkill, ExtractionResult, QueryEvidence, QueryResult } from "@/lib/types";
import { demoEvidence } from "@/lib/demo-data";
import { localExtract, normalizeExtraction } from "@/lib/local-extractor";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function extractWithAI(text: string, skill: AtlasSkill): Promise<ExtractionResult> {
  if (!hasOpenAIKey()) return localExtract(text);

  const response = await callOpenAIJson([
    {
      role: "system",
      content: [
        skill.systemPrompt,
        "Extract a compact startup memory graph from the user's notes.",
        "Return only JSON with keys: title, summary, entities, relationships, decisions, risks, followUps.",
        "Entity type must be one of Founder, Investor, Customer, Meeting, Feature, Decision, Objection, Risk, FollowUp, Theme.",
        "Relationship type must be one of MENTIONED_IN, RAISED_BY, BLOCKED_BY, CAUSED_BY, DECIDED_IN, PRIORITIZED_BECAUSE, FOLLOWED_UP_ON, RELATED_TO, REPEATED_IN.",
        "Every relationship must include sourceName, sourceType, targetName, targetType, type, evidence, confidence.",
        `Skill extraction focus: ${skill.extractionFocus.join(", ")}.`,
      ].join("\n"),
    },
    { role: "user", content: text },
  ]);

  return normalizeExtraction(response);
}

export async function answerWithAI(question: string, skill: AtlasSkill, evidence: QueryEvidence[], mode: "neo4j" | "demo"): Promise<QueryResult> {
  if (!hasOpenAIKey()) {
    return fallbackAnswer(question, skill, evidence.length ? evidence : demoEvidence, mode);
  }

  const response = await callOpenAIJson([
    {
      role: "system",
      content: [
        skill.systemPrompt,
        "Answer from the supplied Neo4j graph evidence only.",
        "Return JSON with keys: answer, evidence, nextActions, cypherSummary.",
        "The evidence array must cite node, type, relationship, neighbor, and evidence when present.",
        "If evidence is weak, say what data is missing instead of inventing facts.",
        `Answer style: ${skill.answerStyle}.`,
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          question,
          skill: skill.name,
          graphEvidence: evidence,
        },
        null,
        2,
      ),
    },
  ]);

  return {
    answer: String(response.answer || fallbackAnswer(question, skill, evidence, mode).answer),
    evidence: Array.isArray(response.evidence) && response.evidence.length ? response.evidence : evidence,
    nextActions: Array.isArray(response.nextActions) ? response.nextActions.map(String).slice(0, 5) : [],
    cypherSummary: String(response.cypherSummary || "Graph context was assembled from relevant memory nodes and relationships."),
    mode,
  };
}

async function callOpenAIJson(messages: Array<{ role: "system" | "user"; content: string }>): Promise<Record<string, unknown>> {
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("OpenAI response did not include JSON content.");
  return JSON.parse(content);
}

function fallbackAnswer(question: string, skill: AtlasSkill, evidence: QueryEvidence[], mode: "neo4j" | "demo"): QueryResult {
  const lines = evidence.slice(0, 4).map((item) => `${item.node}${item.neighbor ? ` -> ${item.neighbor}` : ""}: ${item.evidence}`);
  const riskTone = skill.id === "risk-radar" ? "The highest risk pattern is repeated enterprise trust friction." : "The graph points to enterprise trust as the main operating pattern.";
  const investorTone = skill.id === "investor-brief" ? "For investors, frame this as demand validation with a clear trust-readiness mitigation." : "";

  return {
    answer: [
      `${riskTone} ${investorTone}`.trim(),
      `Question: ${question}`,
      `Evidence: ${lines.join(" ")}`,
    ].join("\n\n"),
    evidence,
    nextActions: [
      "Create a trust-readiness sprint around SOC2, audit logs, SSO, and retention controls.",
      "Send enterprise prospects a dated compliance timeline with named owners.",
      "Track whether new objections attach to the same risk cluster after the next ingestion.",
    ],
    cypherSummary: mode === "neo4j" ? "Used Neo4j graph relationships around blockers, risks, customers, and investors." : "Demo evidence used because Neo4j is not configured yet.",
    mode,
  };
}
