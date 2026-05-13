import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getQueryEvidence } from "@/lib/neo4j";
import { answerWithAI } from "@/lib/openai";
import { getSkill } from "@/lib/skills";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  question: z.string().min(5, "Ask a specific question about company memory."),
  skillId: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON.", 400);
  }

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return fail("validation_error", "Query request is invalid.", 422, parsed.error.flatten());
  }

  const skill = getSkill(parsed.data.skillId);

  try {
    const context = await getQueryEvidence(parsed.data.question);
    const answer = await answerWithAI(parsed.data.question, skill, context.evidence, context.mode);
    return ok({ ...answer, skill });
  } catch (error) {
    return fail("query_failed", "Atlas could not answer from the graph.", 500, error instanceof Error ? error.message : error);
  }
}
