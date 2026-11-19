import { z } from "zod";
import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { postComment } from "@/lib/plans/updates";

const bodySchema = z.object({ body: z.string() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await mutationGuard(request, "message");
  if (!guard.ok) return guard.response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "invalid", "Write a short update.");
  const { id } = await context.params;
  try {
    const posted = postComment(guard.db, guard.user, id, parsed.data.body);
    if (!posted.ok) return jsonError(403, "forbidden", posted.message);
    return Response.json({ ok: true });
  } catch (error) {
    logFailure("activity_message", error);
    return jsonError(500, "store", "Kindle could not save that comment.");
  }
}
