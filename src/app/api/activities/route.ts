import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { createActivity } from "@/lib/plans/service";
import { activitySchema, type ActivityInput } from "@/lib/validators/activity";
import { zodFields } from "@/lib/validators/profile";

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "createActivity");
  if (!guard.ok) return guard.response;
  const body = await readJson(request);
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", "Check the highlighted fields.", zodFields(parsed.error));
  }
  try {
    const created = createActivity(guard.db, guard.user, parsed.data as ActivityInput);
    if (!created.ok) return jsonError(400, "invalid", created.message);
    return Response.json({ ok: true, activity: created.plan, replayed: created.replayed });
  } catch (error) {
    logFailure("activity_create", error);
    return jsonError(500, "store", "Kindle could not save that plan.");
  }
}
