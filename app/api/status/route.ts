import { ok } from "@/lib/api-response";
import { getStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(getStatus());
}
