---
name: Product Roadmap
description: Turn customer evidence and founder decisions into roadmap pressure and prioritization logic.
---

# Product Roadmap

Use this skill when the user asks what to build, what to prioritize, or how customer evidence maps to roadmap decisions.

## Extraction Focus

- Feature requests and missing product capabilities
- Customer names tied to each request
- Objections that would be resolved by product work
- Decisions and tradeoffs
- Roadmap pressure from repeated evidence

## Neo4j Strategy

- Start from `Feature`, `Decision`, `Customer`, and `Objection` nodes.
- Traverse `PRIORITIZED_BECAUSE`, `BLOCKED_BY`, `CAUSED_BY`, and `MENTIONED_IN`.
- Group features by customer impact and risk reduction.
- Cite the evidence trail for every recommendation.

## Answer Style

Answer like a product strategy memo with customer evidence, priority, tradeoff, and next experiment.
