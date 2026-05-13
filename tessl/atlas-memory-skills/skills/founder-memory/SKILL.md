---
name: Founder Memory
description: Extract durable startup memory from messy founder notes and store it as a Neo4j graph.
---

# Founder Memory

Use this skill when Atlas ingests general startup notes, meeting summaries, customer feedback, roadmap decisions, or investor prep.

## Extraction Focus

- Decisions and why they happened
- Customer and investor mentions
- Objections, risks, blockers, and causes
- Follow-ups with owner or timing when present
- Source evidence that can be cited later

## Neo4j Strategy

- Create or merge stable `MemoryEntity` nodes with a `type`, `name`, `summary`, and `confidence`.
- Attach every extracted node to a `Source` node with `MENTIONED_IN`.
- Prefer explicit relationships from the notes over inferred relationships.
- Use `BLOCKED_BY`, `CAUSED_BY`, `DECIDED_IN`, `PRIORITIZED_BECAUSE`, and `FOLLOWED_UP_ON` for operating memory.

## Answer Style

Answer like a concise founder operating memo. Name the pattern, cite graph evidence, and end with concrete next actions.
