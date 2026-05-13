---
name: Investor Brief
description: Convert Neo4j founder memory into investor-ready concerns, proof points, and updates.
---

# Investor Brief

Use this skill when the user asks for board prep, investor update framing, fundraising risk, or proof of traction.

## Extraction Focus

- Investor concerns and repeated questions
- Customer proof points
- Market validation
- Risks that affect growth narrative
- Decisions that show focus and execution

## Neo4j Strategy

- Start with `Investor`, `Customer`, `Risk`, and `Decision` nodes.
- Traverse `RAISED_BY`, `BLOCKED_BY`, `RELATED_TO`, and `PRIORITIZED_BECAUSE`.
- Group repeated concerns instead of listing every mention.
- Always include source-backed evidence.

## Answer Style

Frame the response as an investor-ready update with narrative, proof, risk, mitigation, and the next milestone.
