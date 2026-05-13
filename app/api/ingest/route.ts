import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { storeDemoExtraction } from "@/lib/demo-store";
import { neo4jConfigured, storeExtraction } from "@/lib/neo4j";
import { extractWithAI } from "@/lib/openai";
import { getSkill } from "@/lib/skills";

export const dynamic = "force-dynamic";

const ingestSchema = z.object({
  text: z.string().min(20, "Paste at least a few lines of startup memory."),
  skillId: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON.", 400);
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("validation_error", "Ingestion request is invalid.", 422, parsed.error.flatten());
  }

  const skill = getSkill(parsed.data.skillId);

  try {
    const extraction = await extractWithAI(parsed.data.text, skill);
    const storage = neo4jConfigured()
      ? await storeExtraction(parsed.data.text, extraction, skill.id)
      : storeDemoExtraction(parsed.data.text, extraction);

    return ok({
      extraction,
      storage,
      mode: neo4jConfigured() ? "neo4j" : "demo",
      skill,
    });
  } catch (error) {
    return fail("ingestion_failed", "Atlas could not ingest these notes.", 500, error instanceof Error ? error.message : error);
  }
}
