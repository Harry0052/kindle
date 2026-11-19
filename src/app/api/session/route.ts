import { saveProfile } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { clientIp, jsonError, readJson, requestIsSecure, sameOrigin } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";
import { profileSchema, zodFields } from "@/lib/validators/profile";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return jsonError(403, "origin", "Open Kindle in this tab and try again.");
  }
  const db = getDb();
  if (!consumeRateLimit(db, `profile:${clientIp(request)}`, LIMITS.profile.limit, LIMITS.profile.windowMs)) {
    return jsonError(429, "rate", "Too many profile saves. Wait a while and try again.");
  }
  const body = await readJson(request);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", "Check the highlighted fields.", zodFields(parsed.error));
  }
  try {
    const saved = await saveProfile(db, parsed.data, requestIsSecure(request));
    if (!saved.ok) return jsonError(400, "invalid", saved.message);
    return Response.json({
      ok: true,
      user: { displayName: saved.user.displayName, timezone: saved.user.timezone },
    });
  } catch (error) {
    logFailure("session", error);
    return jsonError(500, "store", "Kindle could not save that profile.");
  }
}
