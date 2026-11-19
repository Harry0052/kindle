import { clearSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin } from "@/lib/http";
import { logFailure } from "@/lib/observability";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return jsonError(403, "origin", "Open Kindle in this tab and try again.");
  }
  try {
    await clearSessionCookie(getDb());
    return Response.json({ ok: true });
  } catch (error) {
    logFailure("logout", error);
    return jsonError(500, "store", "Kindle could not log you out.");
  }
}
