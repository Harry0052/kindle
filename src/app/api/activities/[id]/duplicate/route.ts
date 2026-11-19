import { z } from "zod";
import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { duplicatePlan } from "@/lib/plans/safety";

const bodySchema = z.object({ startsLocal: z.string() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await mutationGuard(request, "createActivity");
  if (!guard.ok) return guard.response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "invalid", "Choose a time for the new plan.");
  const { id } = await context.params;
  try {
    const copy = duplicatePlan(guard.db, guard.user, id, parsed.data.startsLocal);
    if (!copy.ok || !copy.plan) return jsonError(400, "invalid", copy.ok ? "Kindle could not copy that plan." : copy.message);
    return Response.json({ ok: true, activityId: copy.plan.id });
  } catch (error) {
    logFailure("duplicate", error);
    return jsonError(500, "store", "Kindle could not copy that plan.");
  }
}
