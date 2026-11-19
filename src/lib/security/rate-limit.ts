import { eq } from "drizzle-orm";
import type { KindleDb } from "@/lib/db/client";
import { rateBuckets } from "@/lib/db/schema";

export function consumeRateLimit(db: KindleDb, key: string, limit: number, windowMs: number, now = Date.now()) {
  return db.transaction((tx) => {
    const row = tx.select().from(rateBuckets).where(eq(rateBuckets.bucketKey, key)).get();
    const fresh = !row || now - Date.parse(row.windowStart) >= windowMs;
    if (fresh) {
      tx.insert(rateBuckets)
        .values({ bucketKey: key, windowStart: new Date(now).toISOString(), count: 1 })
        .onConflictDoUpdate({
          target: rateBuckets.bucketKey,
          set: { windowStart: new Date(now).toISOString(), count: 1 },
        })
        .run();
      return true;
    }
    if (row.count >= limit) return false;
    tx.update(rateBuckets)
      .set({ count: row.count + 1 })
      .where(eq(rateBuckets.bucketKey, key))
      .run();
    return true;
  });
}

export const LIMITS = {
  profile: { limit: 40, windowMs: 60 * 60 * 1000 },
  createActivity: { limit: 30, windowMs: 60 * 60 * 1000 },
  rsvp: { limit: 80, windowMs: 60 * 60 * 1000 },
  message: { limit: 40, windowMs: 60 * 60 * 1000 },
  invite: { limit: 20, windowMs: 60 * 60 * 1000 },
  friend: { limit: 40, windowMs: 60 * 60 * 1000 },
  report: { limit: 10, windowMs: 60 * 60 * 1000 },
  block: { limit: 20, windowMs: 60 * 60 * 1000 },
  export: { limit: 10, windowMs: 60 * 60 * 1000 },
  deleteAccount: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;
