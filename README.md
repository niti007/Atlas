# Atlas: Founder Memory OS

Atlas is a hackathon MVP that turns messy startup notes into a Neo4j knowledge graph, then uses Tessl-style skills to change how the AI extracts, queries, and explains company memory.

## What It Demonstrates

- Neo4j as the connected memory layer for founders.
- Tessl skills as versioned Markdown context that teaches AI behavior.
- Non-chat surfaces: graph view, blocker boards, investor concerns, roadmap pressure, and evidence trails.
- A small chat surface that answers from graph context instead of free-floating conversation.

## Setup

1. Install dependencies:

   ```powershell
   & 'C:\Program Files\nodejs\npm.cmd' install
   ```

2. Create `.env.local` from `.env.example` and fill in:

   ```text
   OPENAI_API_KEY=
   NEO4J_URI=
   NEO4J_USERNAME=
   NEO4J_PASSWORD=
   NEO4J_DATABASE=neo4j
   ```

3. Run the app:

   ```powershell
   & 'C:\Program Files\nodejs\npm.cmd' run dev
   ```

The UI runs in demo mode without keys. Real ingestion, storage, and graph-backed answers require Neo4j credentials. `OPENAI_API_KEY` is used for structured extraction and final answers; without it, Atlas uses a local heuristic fallback.

## Neo4j Python Connectivity Check

The project includes the same official-driver check as the hackathon prompt:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:NEO4J_URI="neo4j+s://your-instance.databases.neo4j.io"
$env:NEO4J_USERNAME="neo4j"
$env:NEO4J_PASSWORD="your-password"
.\.venv\Scripts\python.exe scripts\verify_neo4j.py
```

## Tessl

The custom Tessl tile lives at `tessl/atlas-memory-skills`. It can be inspected directly in the app and installed locally with Tessl when the CLI is available:

```powershell
tessl install file:./tessl/atlas-memory-skills
```

The tile contains four skills:

- `founder-memory`
- `investor-brief`
- `risk-radar`
- `product-roadmap`

Each skill changes extraction focus, Cypher strategy, dashboard priorities, and answer tone.
