---
name: Risk Radar
description: Detect blockers, repeated objections, unresolved follow-ups, and risk clusters in Neo4j.
---

# Risk Radar

Use this skill when the user asks why something is blocked, what is risky, what is repeated, or what needs action.

## Extraction Focus

- Security, compliance, procurement, legal, and product blockers
- Repeated customer objections
- Unresolved follow-ups
- Risks that appear across multiple customers or investors
- Evidence that explains severity

## Neo4j Strategy

- Start from `Risk` and `Objection` nodes.
- Traverse `BLOCKED_BY`, `CAUSED_BY`, `RAISED_BY`, and `REPEATED_IN`.
- Rank nodes by relationship count and customer/investor proximity.
- Prefer clusters that show the same pattern across multiple sources.

## Answer Style

Answer like a risk register: pattern, severity, graph evidence, likely impact, and mitigation steps.
