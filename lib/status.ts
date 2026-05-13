import { hasOpenAIKey } from "@/lib/openai";
import { neo4jConfigured } from "@/lib/neo4j";

export function getStatus() {
  return {
    openaiConfigured: hasOpenAIKey(),
    neo4jConfigured: neo4jConfigured(),
    tesslTilePath: "tessl/atlas-memory-skills/tile.json",
  };
}
