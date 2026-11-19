import { readSessionUser } from "@/lib/auth/session";
import { getDb, type KindleDb } from "@/lib/db/client";
import type { PublicUser } from "@/lib/auth/users";
import { jsonError, sameOrigin } from "@/lib/http";
import { LIMITS, consumeRateLimit } from "@/lib/security/rate-limit";

export async function mutationGuard(request: Request, bucket: keyof typeof LIMITS) {
  if (!sameOrigin(request)) {
    return { ok: false as const, response: jsonError(403, "origin", "Open Kindle in this tab and try again.") };
  }
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user || user.kind !== "member") {
    return { ok: false as const, response: jsonError(401, "auth", "Save your profile before doing that.") };
  }
  const limit = LIMITS[bucket];
  if (!consumeRateLimit(db, `${bucket}:${user.id}`, limit.limit, limit.windowMs)) {
    return { ok: false as const, response: jsonError(429, "rate", "Too many requests. Wait a while and try again.") };
  }
  return { ok: true as const, db, user };
}

export type Guarded = { db: KindleDb; user: PublicUser };
