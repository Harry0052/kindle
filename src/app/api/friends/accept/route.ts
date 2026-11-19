import { z } from "zod";
import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { acceptInvite } from "@/lib/friends/service";

const bodySchema = z.object({ token: z.string().trim().min(20).max(200) });

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "friend");
  if (!guard.ok) return guard.response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "invalid", "That friend link is not valid.");
  try {
    const accepted = acceptInvite(guard.db, guard.user.id, parsed.data.token);
    if (!accepted.ok) return jsonError(400, "invalid", accepted.message);
    return Response.json({ ok: true, friendName: accepted.friendName, already: accepted.already });
  } catch (error) {
    logFailure("friend_accept", error);
    return jsonError(500, "store", "Kindle could not save that friendship.");
  }
}