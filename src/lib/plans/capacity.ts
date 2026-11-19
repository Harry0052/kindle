import type Database from "better-sqlite3";

export const CLAIM_SQL =
  "UPDATE activities SET going_count = going_count + 1, updated_at = ? WHERE id = ? AND status = 'published' AND going_count < capacity";

export const RELEASE_SQL =
  "UPDATE activities SET going_count = going_count - 1, updated_at = ? WHERE id = ? AND going_count > 0";

export function claimGoingSlot(sqlite: Database.Database, activityId: string, now: string) {
  const run = sqlite.transaction(() => sqlite.prepare(CLAIM_SQL).run(now, activityId).changes === 1);
  return run.immediate();
}

export function releaseGoingSlot(sqlite: Database.Database, activityId: string, now: string) {
  const run = sqlite.transaction(() => sqlite.prepare(RELEASE_SQL).run(now, activityId).changes === 1);
  return run.immediate();
}
