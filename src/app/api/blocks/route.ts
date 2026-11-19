import { z } from "zod";
import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { blockPerson } from "@/lib/plans/safety";

const bodySchema = z.object({ userId: z.string().uuid() });

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "block");
  if (!guard.ok) return guard.response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "invalid", "Choose a person to block.");
  try {
    const blocked = blockPerson(guard.db, guard.user, parsed.data.userId);
    if (!blocked.ok) return jsonError(400, "invalid", blocked.message);
    return Response.json({ ok: true });
  } catch (error) {
    logFailure("block", error);
    return jsonError(500, "store", "Kindle could not save that block.");
  }
}
