import { fail, ok } from "@/lib/api-response";
import { getInsights } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getInsights());
  } catch (error) {
    return fail("insights_load_failed", "Could not load Atlas insights.", 500, error instanceof Error ? error.message : error);
  }
}
