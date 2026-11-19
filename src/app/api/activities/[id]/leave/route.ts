import { mutationGuard } from "@/lib/http/guard";
import { jsonError } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { leavePlan } from "@/lib/plans/safety";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await mutationGuard(request, "rsvp");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  try {
    const left = leavePlan(guard.db, guard.user, id);
    if (!left.ok) return jsonError(400, "invalid", left.message);
    return Response.json({ ok: true });
  } catch (error) {
    logFailure("leave", error);
    return jsonError(500, "store", "Kindle could not save that you left.");
  }
}
