import { readSessionUser } from "@/lib/auth/session";
import { exportAccount } from "@/lib/account/privacy";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "origin", "Open Kindle in this tab and try again.");
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user || user.kind !== "member") return jsonError(401, "auth", "Save your profile first.");
  if (!consumeRateLimit(db, `export:${user.id}`, LIMITS.export.limit, LIMITS.export.windowMs)) {
    return jsonError(429, "rate", "Too many downloads. Wait a while and try again.");
  }
  try {
    const data = exportAccount(db, user);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": "attachment; filename=\"kindle-export.json\"",
      },
    });
  } catch (error) {
    logFailure("export", error);
    return jsonError(500, "store", "Kindle could not prepare that download.");
  }
}
