# 🧠 Atlas — AI Memory OS for Founders (1-Hour Hack Version)

## 🚀 What is Atlas?

Atlas is a **simple AI system that remembers everything about your startup and answers questions using a knowledge graph**.

It is NOT a chatbot.
It is a **company memory layer built on Neo4j**.

---

# 🎯 Core Idea

Startups forget everything:

* decisions
* customer feedback
* investor concerns
* roadmap reasoning

Atlas fixes that by turning all data into a **living graph of company memory**.

---

# 🧩 Minimal Architecture (Hackathon Version)

## 🔵 Neo4j — Memory Brain

Stores all company knowledge as a graph:

### Nodes:

* Founder
* Investor
* Customer
* Meeting
* Feature
* Decision
* Objection

### Relationships:

* BLOCKED_BY
* CAUSED_BY
* MENTIONED_IN
* PRIORITIZED_BECAUSE
* FOLLOWED_UP_ON

> Everything becomes connected memory.

---

## 🟣 Tessl — Skills Layer (Simple Version)

Skills are just **prompt modules that change Atlas behavior**.

### Example Skills:

* Investor Mode (summarize investor concerns)
* Product Mode (summarize roadmap)
* Risk Mode (detect blockers)

### Implementation (simple):

* each skill = a JSON prompt template
* switch system prompt based on selected skill

> No complexity. Just “behavior switches.”

---

# 🧠 What Atlas Can Do (MVP)

## 1. Memory Ingestion

Upload or paste:

* meeting notes
* Slack messages
* customer feedback

Atlas extracts:

* entities
* relationships
* decisions

Stores them in Neo4j.

---

## 2. Graph-Based Q&A

Ask:

> Why are enterprise deals slowing down?

Atlas responds using graph connections:

* missing SOC2 appears in multiple objections
* enterprise customers blocked by security concerns
* past deals lost due to same issue

---

## 3. Skill Switching

User selects mode:

* Investor Mode
* Product Mode
* Risk Mode

Each mode changes how Atlas answers questions.

---

# ⚙️ Simple Build Plan (1 Hour)

## ⏱️ 0–10 min

* Setup Next.js frontend
* Add simple chat UI

## ⏱️ 10–25 min

* Connect Neo4j Aura DB
* Create schema (nodes + relationships)

## ⏱️ 25–40 min

* Build ingestion endpoint:

  * send text → LLM → extract entities → store in Neo4j

## ⏱️ 40–55 min

* Build query endpoint:

  * user question → retrieve relevant graph nodes → LLM response

## ⏱️ 55–60 min

* Add skill switch (simple dropdown)

---

# 🧪 Demo Flow (KEEP SIMPLE)

## Step 1

Paste messy startup notes

## Step 2

Show graph forming in Neo4j UI

## Step 3

Ask question:

> Why are we losing deals?

## Step 4

Switch skill:

* Investor Mode
* Risk Mode

Answer changes instantly

---

# 💡 Key Insight

Atlas is not about complexity.
It is about:

> turning messy company data into structured memory that improves answers

---

# 🏁 Winning Positioning

Say this:

> "Atlas is a memory layer for startups built on a knowledge graph. It turns company history into structured intelligence that improves decision-making."

Or shorter:

> "A living memory system for companies."

---

# ❌ What We Removed (Intentionally)

* no autonomous agents
* no complex skill runtime
* no continuous loops
* no multi-agent system
* no overengineering

> This is a ship-fast MVP.

---

# 🚀 End Goal

Working demo that shows:

* data → graph → insight
* simple skill switching
* real AI reasoning over company memory

> That is enough to win a hackathon if the demo is strong.
