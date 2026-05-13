"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  CircleDot,
  Database,
  FileText,
  GitBranch,
  Loader2,
  Network,
  Play,
  Radar,
  RefreshCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { sampleStartupNotes } from "@/lib/demo-data";
import type { AtlasSkill, ExtractionResult, GraphPayload, InsightItem, InsightPayload, QueryResult } from "@/lib/types";

type StatusPayload = {
  openaiConfigured: boolean;
  neo4jConfigured: boolean;
  tesslTilePath: string;
};

type ApiEnvelope<T> = { data: T };

const nodeColors: Record<string, string> = {
  Source: "#36312b",
  Customer: "#245e8f",
  Investor: "#7c4f13",
  Risk: "#b43f32",
  Objection: "#c77b13",
  Feature: "#0f7d62",
  Decision: "#5f6f2a",
  FollowUp: "#7d4261",
  Founder: "#171717",
  Meeting: "#5c625f",
  Theme: "#406d62",
};

export default function Home() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [skills, setSkills] = useState<AtlasSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("founder-memory");
  const [notes, setNotes] = useState(sampleStartupNotes);
  const [question, setQuestion] = useState("Why are we losing enterprise deals?");
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [insights, setInsights] = useState<InsightPayload | null>(null);
  const [answer, setAnswer] = useState<QueryResult | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [busy, setBusy] = useState<string | null>("load");
  const [message, setMessage] = useState<string | null>(null);

  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) || skills[0];

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    setBusy("load");
    setMessage(null);
    try {
      const [statusData, skillsData, graphData, insightsData] = await Promise.all([
        fetchJson<StatusPayload>("/api/status"),
        fetchJson<AtlasSkill[]>("/api/skills"),
        fetchJson<GraphPayload>("/api/graph"),
        fetchJson<InsightPayload>("/api/insights"),
      ]);
      setStatus(statusData);
      setSkills(skillsData);
      setGraph(graphData);
      setInsights(insightsData);
      if (!skillsData.find((skill) => skill.id === selectedSkillId)) setSelectedSkillId(skillsData[0]?.id || "founder-memory");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Atlas failed to load.");
    } finally {
      setBusy(null);
    }
  }

  async function ingest() {
    setBusy("ingest");
    setMessage(null);
    try {
      const data = await fetchJson<{ extraction: ExtractionResult; mode: "neo4j" | "demo" }>("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes, skillId: selectedSkillId }),
      });
      setExtraction(data.extraction);
      await refreshGraphAndInsights();
      setMessage(data.mode === "neo4j" ? "Memory written to Neo4j." : "Memory added to the local demo graph.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ingestion failed.");
    } finally {
      setBusy(null);
    }
  }

  async function askAtlas() {
    setBusy("query");
    setMessage(null);
    try {
      const data = await fetchJson<QueryResult>("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, skillId: selectedSkillId }),
      });
      setAnswer(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Query failed.");
    } finally {
      setBusy(null);
    }
  }

  async function refreshGraphAndInsights() {
    const [graphData, insightsData, statusData] = await Promise.all([
      fetchJson<GraphPayload>("/api/graph"),
      fetchJson<InsightPayload>("/api/insights"),
      fetchJson<StatusPayload>("/api/status"),
    ]);
    setGraph(graphData);
    setInsights(insightsData);
    setStatus(statusData);
  }

  const metrics = useMemo(
    () => ({
      nodes: graph?.nodes.length || 0,
      edges: graph?.edges.length || 0,
      insights:
        (insights?.blockers.length || 0) +
        (insights?.investorConcerns.length || 0) +
        (insights?.roadmapPressure.length || 0) +
        (insights?.followUps.length || 0),
    }),
    [graph, insights],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-lockup">
            <div className="brand-mark" title="Atlas">
              <Network size={25} />
            </div>
            <div>
              <p className="eyebrow">Neo4j + Tessl Hackathon Prototype</p>
              <h1>Atlas</h1>
            </div>
          </div>
          <p className="subtitle">
            A founder memory OS that turns messy company history into graph-backed insight boards, evidence trails, and skill-specific operating answers.
          </p>
        </div>

        <div className="status-strip" aria-label="Integration status">
          <span className="pill" data-state={status?.neo4jConfigured ? "live" : "demo"}>
            <Database size={14} />
            Neo4j {status?.neo4jConfigured ? "configured" : "demo"}
          </span>
          <span className="pill" data-state={status?.openaiConfigured ? "live" : "demo"}>
            <Brain size={14} />
            OpenAI {status?.openaiConfigured ? "configured" : "fallback"}
          </span>
          <span className="pill" data-state="live">
            <Sparkles size={14} />
            Tessl tile ready
          </span>
        </div>
      </header>

      <section className="main-grid">
        <aside className="workspace">
          <section className="tool-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sparkles size={18} />
                <h2>Tessl Skills</h2>
              </div>
              <button className="button secondary" title="Refresh" onClick={refreshAll} disabled={Boolean(busy)}>
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="skill-list">
              {skills.map((skill) => (
                <button key={skill.id} className="skill-button" data-active={skill.id === selectedSkillId} onClick={() => setSelectedSkillId(skill.id)}>
                  {skill.id === "risk-radar" ? <Radar size={18} /> : <CircleDot size={18} />}
                  <span>
                    <strong>{skill.name}</strong>
                    <span className="skill-lens">{skill.lens}</span>
                  </span>
                </button>
              ))}
            </div>

            {selectedSkill && (
              <p className="footer-note">
                Active tile: {selectedSkill.filePath}. Query strategy: {selectedSkill.queryStrategy}
              </p>
            )}
          </section>

          <section className="tool-panel">
            <div className="panel-title">
              <FileText size={18} />
              <h2>Memory Inbox</h2>
            </div>
            <textarea className="memory-input" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <div className="actions">
              <button className="button" onClick={ingest} disabled={Boolean(busy)}>
                {busy === "ingest" ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
                Ingest
              </button>
              <button className="button secondary" onClick={() => setNotes(sampleStartupNotes)} disabled={Boolean(busy)}>
                <RefreshCcw size={16} />
                Sample
              </button>
            </div>
            {message && <p className="footer-note">{message}</p>}
          </section>

          {extraction && (
            <section className="tool-panel">
              <div className="panel-title">
                <CheckCircle2 size={18} />
                <h2>Latest Extraction</h2>
              </div>
              <p className="subtitle">{extraction.summary}</p>
              <div className="extraction">
                {extraction.entities.slice(0, 12).map((entity) => (
                  <span key={`${entity.type}-${entity.name}`} className="entity-chip">
                    {entity.type}: {entity.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </aside>

        <div className="workspace">
          <section className="band">
            <div className="tool-panel graph-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <GitBranch size={18} />
                  <h2>Graph Memory</h2>
                </div>
                <span className="pill" data-state={graph?.mode === "neo4j" ? "live" : "demo"}>
                  {graph?.mode === "neo4j" ? "Neo4j live" : "Demo graph"}
                </span>
              </div>

              <div className="metric-row">
                <Metric label="Nodes" value={metrics.nodes} />
                <Metric label="Edges" value={metrics.edges} />
                <Metric label="Insights" value={metrics.insights} />
              </div>
            </div>
            <Graph graph={graph} />
          </section>

          <section className="tool-panel">
            <div className="panel-title">
              <AlertTriangle size={18} />
              <h2>Insight Boards</h2>
            </div>
            <div className="insight-grid">
              <InsightColumn title="Top Blockers" items={insights?.blockers || []} />
              <InsightColumn title="Investor Concerns" items={insights?.investorConcerns || []} />
              <InsightColumn title="Roadmap Pressure" items={insights?.roadmapPressure || []} />
              <InsightColumn title="Open Follow-ups" items={insights?.followUps || []} />
            </div>
          </section>

          <section className="tool-panel">
            <div className="panel-title">
              <Send size={18} />
              <h2>Ask Atlas</h2>
            </div>
            <div className="ask-row">
              <input className="question-input" value={question} onChange={(event) => setQuestion(event.target.value)} />
              <button className="button" onClick={askAtlas} disabled={Boolean(busy)}>
                {busy === "query" ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                Ask
              </button>
            </div>

            {answer && (
              <>
                <div className="answer">{answer.answer}</div>
                <InsightColumn title="Evidence Trail" items={answer.evidence.map((item, index) => ({
                  id: `${item.node}-${index}`,
                  title: item.neighbor ? `${item.node} -> ${item.neighbor}` : item.node,
                  type: item.type,
                  count: 1,
                  summary: item.relationship || "Graph evidence",
                  evidence: [item.evidence],
                }))} />
                <ul className="next-actions">
                  {answer.nextActions.map((action) => (
                    <li key={action}>
                      <CheckCircle2 size={15} />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}

function InsightColumn({ title, items }: { title: string; items: InsightItem[] }) {
  return (
    <div className="insight-column">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <div className="insight-card">
          <p>No graph signals yet.</p>
        </div>
      ) : (
        items.slice(0, 4).map((item) => (
          <article className="insight-card" key={item.id}>
            <h3>
              {item.title} <span className="skill-lens">({item.count})</span>
            </h3>
            <p>{item.summary}</p>
            <ul className="evidence-list">
              {item.evidence.slice(0, 2).map((evidence, evidenceIndex) => (
                <li key={`${item.id}-evidence-${evidenceIndex}`}>{evidence}</li>
              ))}
            </ul>
          </article>
        ))
      )}
    </div>
  );
}

function Graph({ graph }: { graph: GraphPayload | null }) {
  const layout = useMemo(() => {
    const nodes = (graph?.nodes || []).slice(0, 26);
    const width = 860;
    const height = 430;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const positions = new Map<string, { x: number; y: number }>();

    nodes.forEach((node, index) => {
      const sourceBoost = node.type === "Source" ? 0.52 : 1;
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius * sourceBoost,
        y: centerY + Math.sin(angle) * radius * sourceBoost,
      });
    });

    return {
      nodes,
      edges: (graph?.edges || []).filter((edge) => positions.has(edge.source) && positions.has(edge.target)).slice(0, 60),
      positions,
      width,
      height,
    };
  }, [graph]);

  return (
    <div className="graph-canvas">
      <svg className="graph-svg" viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Atlas memory graph">
        {layout.edges.map((edge, edgeIndex) => {
          const source = layout.positions.get(edge.source)!;
          const target = layout.positions.get(edge.target)!;
          return <line className="edge" key={`${edge.id}-${edgeIndex}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />;
        })}
        {layout.nodes.map((node) => {
          const position = layout.positions.get(node.id)!;
          return (
            <g className="node" key={node.id} transform={`translate(${position.x}, ${position.y})`}>
              <circle r={node.type === "Source" ? 18 : 14} fill={nodeColors[node.type] || "#406d62"} />
              <text x={0} y={node.type === "Source" ? 34 : 29} textAnchor="middle">
                {compactLabel(node.label)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || `Request failed: ${response.status}`);
  }
  return (json as ApiEnvelope<T>).data;
}

function compactLabel(label: string): string {
  return label.length > 18 ? `${label.slice(0, 16)}...` : label;
}
