import { z } from "zod";
import { clearSessionCookie, readSessionUser } from "@/lib/auth/session";
import { deleteAccount } from "@/lib/account/privacy";
import { getDb } from "@/lib/db/client";
import { jsonError, readJson, sameOrigin } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({ displayName: z.string() });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "origin", "Open Kindle in this tab and try again.");
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user || user.kind !== "member") return jsonError(401, "auth", "Save your profile first.");
  if (!consumeRateLimit(db, `delete:${user.id}`, LIMITS.deleteAccount.limit, LIMITS.deleteAccount.windowMs)) {
    return jsonError(429, "rate", "Too many delete attempts. Wait a while and try again.");
  }
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success || parsed.data.displayName !== user.displayName) {
    return jsonError(400, "invalid", "Type your name exactly to delete the profile.");
  }
  try {
    deleteAccount(db, user);
    await clearSessionCookie(db);
    return Response.json({ ok: true });
  } catch (error) {
    logFailure("delete", error);
    return jsonError(500, "store", "Kindle could not delete that profile.");
  }
}
