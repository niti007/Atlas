import { ok } from "@/lib/api-response";
import { getSkills } from "@/lib/skills";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(getSkills());
}
