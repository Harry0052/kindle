import { mutationGuard } from "@/lib/http/guard";
import { jsonError } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { publishActivity } from "@/lib/plans/service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await mutationGuard(request, "createActivity");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  try {
    const published = publishActivity(guard.db, guard.user, id);
    if (!published.ok) return jsonError(404, "hidden", published.message);
    return Response.json({ ok: true, activity: published.plan });
  } catch (error) {
    logFailure("activity_publish", error);
    return jsonError(500, "store", "Kindle could not publish that plan.");
  }
}
