import { z } from "zod";
import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { respondToPlan } from "@/lib/plans/service";

const bodySchema = z.object({ intent: z.enum(["going", "declined"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await mutationGuard(request, "rsvp");
  if (!guard.ok) return guard.response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "invalid", "Choose I'm in or Can't go.");
  const { id } = await context.params;
  try {
    const result = respondToPlan(guard.db, guard.user, id, parsed.data.intent);
    if (!result.ok) return jsonError(404, "hidden", result.message);
    return Response.json({
      ok: true,
      status: result.status,
      message: result.message ?? null,
      exactLocation: result.plan?.exactLocation ?? null,
      goingCount: result.plan?.goingCount ?? null,
    });
  } catch (error) {
    logFailure("rsvp", error);
    return jsonError(500, "store", "Kindle could not save that response.");
  }
}
