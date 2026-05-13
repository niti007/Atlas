import { fail, ok } from "@/lib/api-response";
import { neo4jConfigured, verifyNeo4j } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!neo4jConfigured()) {
    return ok({
      connected: false,
      mode: "demo",
      message: "Neo4j credentials are not set. Add NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD to .env.local.",
    });
  }

  try {
    await verifyNeo4j();
    return ok({ connected: true, mode: "neo4j", message: "Neo4j connectivity verified." });
  } catch (error) {
    return fail("neo4j_connectivity_failed", "Neo4j connectivity failed.", 500, error instanceof Error ? error.message : error);
  }
}
