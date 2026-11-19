import { mutationGuard } from "@/lib/http/guard";
import { jsonError, publicOrigin } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { createFriendInvite } from "@/lib/friends/service";

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "invite");
  if (!guard.ok) return guard.response;
  try {
    const invite = createFriendInvite(guard.db, guard.user.id);
    return Response.json({
      ok: true,
      path: invite.path,
      url: `${publicOrigin(request)}${invite.path}`,
    });
  } catch (error) {
    logFailure("friend_invite", error);
    return jsonError(500, "store", "Kindle could not create that friend link.");
  }
}
