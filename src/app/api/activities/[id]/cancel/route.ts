import { mutationGuard } from "@/lib/http/guard";
import { jsonError } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { cancelPlan } from "@/lib/plans/safety";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await mutationGuard(request, "createActivity");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  try {
    const cancelled = cancelPlan(guard.db, guard.user, id);
    if (!cancelled.ok) return jsonError(404, "hidden", cancelled.message);
    return Response.json({ ok: true });
  } catch (error) {
    logFailure("cancel", error);
    return jsonError(500, "store", "Kindle could not cancel that plan.");
  }
}
