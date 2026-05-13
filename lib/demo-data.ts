import type { GraphPayload, InsightPayload, QueryEvidence } from "@/lib/types";

export const sampleStartupNotes = `April enterprise pipeline review:
- Acme Bank loved the workflow automation but legal blocked the pilot because SOC2 is not complete.
- Northstar Ventures asked whether security gaps will slow enterprise expansion.
- Morgan from Acme said procurement needs an audit log before signing.
- Product decided to prioritize SOC2 evidence collection over the new analytics dashboard.
- Follow up with Acme security team next Tuesday with an updated compliance timeline.

Customer call with Beacon Health:
- Beacon wants SSO and role-based access before a paid rollout.
- They mentioned that two internal champions are still excited, but InfoSec is worried about data retention.
- Founder team agreed this is the same blocker as Acme: enterprise trust is not visible enough.

Investor update prep:
- Investors keep asking if the enterprise motion is repeatable.
- Current risk: deals are not lost because of product value; they stall because trust artifacts are missing.`;

export const demoGraph: GraphPayload = {
  mode: "demo",
  nodes: [
    { id: "source-demo", label: "April pipeline notes", type: "Source", summary: "Sample founder notes" },
    { id: "customer-acme-bank", label: "Acme Bank", type: "Customer", summary: "Enterprise prospect blocked by security review", evidenceCount: 3 },
    { id: "customer-beacon-health", label: "Beacon Health", type: "Customer", summary: "Healthcare prospect asking for SSO and retention controls", evidenceCount: 2 },
    { id: "investor-northstar", label: "Northstar Ventures", type: "Investor", summary: "Asked about repeatability of enterprise expansion", evidenceCount: 2 },
    { id: "risk-soc2", label: "SOC2 incomplete", type: "Risk", summary: "Primary trust blocker across enterprise deals", evidenceCount: 4 },
    { id: "objection-audit-log", label: "Audit log required", type: "Objection", summary: "Procurement needs traceability before signing", evidenceCount: 1 },
    { id: "feature-sso", label: "SSO and RBAC", type: "Feature", summary: "Enterprise readiness requirement", evidenceCount: 2 },
    { id: "decision-prioritize-soc2", label: "Prioritize SOC2 evidence", type: "Decision", summary: "Shift roadmap toward trust artifacts", evidenceCount: 1 },
    { id: "followup-acme-security", label: "Follow up with Acme security", type: "FollowUp", summary: "Send compliance timeline next Tuesday", evidenceCount: 1 },
  ],
  edges: [
    { id: "e1", source: "customer-acme-bank", target: "risk-soc2", type: "BLOCKED_BY", evidence: "Legal blocked the pilot because SOC2 is not complete." },
    { id: "e2", source: "investor-northstar", target: "risk-soc2", type: "RAISED_BY", evidence: "Northstar asked whether security gaps will slow enterprise expansion." },
    { id: "e3", source: "customer-acme-bank", target: "objection-audit-log", type: "BLOCKED_BY", evidence: "Procurement needs an audit log before signing." },
    { id: "e4", source: "customer-beacon-health", target: "feature-sso", type: "BLOCKED_BY", evidence: "Beacon wants SSO and role-based access before rollout." },
    { id: "e5", source: "decision-prioritize-soc2", target: "risk-soc2", type: "PRIORITIZED_BECAUSE", evidence: "Product prioritized SOC2 over analytics." },
    { id: "e6", source: "followup-acme-security", target: "customer-acme-bank", type: "FOLLOWED_UP_ON", evidence: "Follow up with Acme security next Tuesday." },
  ],
};

export const demoInsights: InsightPayload = {
  mode: "demo",
  blockers: [
    {
      id: "risk-soc2",
      title: "SOC2 incomplete",
      type: "Risk",
      count: 4,
      summary: "Enterprise deals are stalling because trust artifacts are missing.",
      evidence: ["Acme legal blocked pilot", "Northstar asked about security gaps", "Product reprioritized SOC2"],
    },
    {
      id: "feature-sso",
      title: "SSO and RBAC",
      type: "Feature",
      count: 2,
      summary: "Beacon Health needs identity controls before rollout.",
      evidence: ["Beacon wants SSO", "Beacon wants role-based access"],
    },
  ],
  investorConcerns: [
    {
      id: "investor-northstar",
      title: "Repeatable enterprise motion",
      type: "Investor",
      count: 2,
      summary: "Investor concern is not product value; it is whether enterprise sales can clear security reviews repeatedly.",
      evidence: ["Northstar asked about expansion", "Investor update asks about repeatability"],
    },
  ],
  roadmapPressure: [
    {
      id: "decision-prioritize-soc2",
      title: "Trust artifacts beat analytics",
      type: "Decision",
      count: 1,
      summary: "The graph points toward compliance and admin controls ahead of analytics polish.",
      evidence: ["Product decided to prioritize SOC2 evidence collection"],
    },
  ],
  followUps: [
    {
      id: "followup-acme-security",
      title: "Acme security timeline",
      type: "FollowUp",
      count: 1,
      summary: "Send updated compliance timeline next Tuesday.",
      evidence: ["Follow up with Acme security team"],
    },
  ],
};

export const demoEvidence: QueryEvidence[] = [
  {
    node: "Acme Bank",
    type: "Customer",
    relationship: "BLOCKED_BY",
    neighbor: "SOC2 incomplete",
    evidence: "Legal blocked the pilot because SOC2 is not complete.",
  },
  {
    node: "Northstar Ventures",
    type: "Investor",
    relationship: "RAISED_BY",
    neighbor: "SOC2 incomplete",
    evidence: "Northstar asked whether security gaps will slow enterprise expansion.",
  },
  {
    node: "Beacon Health",
    type: "Customer",
    relationship: "BLOCKED_BY",
    neighbor: "SSO and RBAC",
    evidence: "Beacon wants SSO and role-based access before a paid rollout.",
  },
];
