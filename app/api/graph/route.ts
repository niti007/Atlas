import { fail, ok } from "@/lib/api-response";
import { getGraph } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getGraph());
  } catch (error) {
    return fail("graph_load_failed", "Could not load Atlas graph.", 500, error instanceof Error ? error.message : error);
  }
}
