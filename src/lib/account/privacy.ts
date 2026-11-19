import { eq, or } from "drizzle-orm";
import type { PublicUser } from "@/lib/auth/users";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import {
  activities,
  activityMessages,
  blocks,
  friendEdges,
  notifications,
  reports,
  rsvps,
  sessions,
  userInterests,
  users,
} from "@/lib/db/schema";
import { nowIso } from "@/lib/time";

export function exportAccount(db: KindleDb, user: PublicUser) {
  const interests = db.select().from(userInterests).where(eq(userInterests.userId, user.id)).all();
  const myRsvps = db.select().from(rsvps).where(eq(rsvps.userId, user.id)).all();
  const goingIds = new Set(myRsvps.filter((row) => row.status === "going").map((row) => row.activityId));
  const visibleActivities = db
    .select()
    .from(activities)
    .all()
    .filter((row) => row.hostId === user.id || goingIds.has(row.id))
    .map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      startsAt: row.startsAt,
      areaLabel: row.areaLabel,
      exactLocation: row.hostId === user.id || goingIds.has(row.id) ? row.exactLocation : null,
      status: row.status,
      hosted: row.hostId === user.id,
    }));
  const messages = db
    .select()
    .from(activityMessages)
    .where(eq(activityMessages.userId, user.id))
    .all()
    .map((row) => ({ id: row.id, activityId: row.activityId, body: row.body, kind: row.kind, createdAt: row.createdAt }));
  const myReports = db.select().from(reports).where(eq(reports.reporterId, user.id)).all();
  recordEvent(db, user.id, "account_exported", {});
  return {
    exportedAt: nowIso(),
    profile: {
      id: user.id,
      displayName: user.displayName,
      timezone: user.timezone,
      homeRegion: user.homeRegion,
      interests: interests.map((row) => row.interest),
      ageAttested: user.ageAttested,
    },
    activities: visibleActivities,
    rsvps: myRsvps.map((row) => ({ activityId: row.activityId, status: row.status, updatedAt: row.updatedAt })),
    messages,
    reports: myReports.map((row) => ({ subjectType: row.subjectType, subjectId: row.subjectId, reason: row.reason, createdAt: row.createdAt })),
  };
}

export function deleteAccount(db: KindleDb, user: PublicUser) {
  const now = nowIso();
  const hosted = db.select().from(activities).where(eq(activities.hostId, user.id)).all();
  for (const plan of hosted) {
    if (plan.status !== "cancelled" && plan.status !== "draft") {
      db.update(rsvps)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(rsvps.activityId, plan.id))
        .run();
    }
    db.update(activities)
      .set({ status: "cancelled", goingCount: 0, exactLocation: null, updatedAt: now })
      .where(eq(activities.id, plan.id))
      .run();
  }
  db.update(activityMessages).set({ body: "[deleted]" }).where(eq(activityMessages.userId, user.id)).run();
  db.delete(userInterests).where(eq(userInterests.userId, user.id)).run();
  db.delete(sessions).where(eq(sessions.userId, user.id)).run();
  db.delete(blocks).where(or(eq(blocks.blockerId, user.id), eq(blocks.blockedId, user.id))).run();
  db.delete(friendEdges).where(or(eq(friendEdges.userLow, user.id), eq(friendEdges.userHigh, user.id))).run();
  db.delete(notifications).where(eq(notifications.userId, user.id)).run();
  db.update(users)
    .set({ displayName: "Deleted member", homeRegion: "", kind: "deleted" })
    .where(eq(users.id, user.id))
    .run();
  recordEvent(db, user.id, "account_deleted", {});
  return { ok: true as const };
}

export function personalCounts(db: KindleDb, userId: string) {
  const hosted = db.select().from(activities).where(eq(activities.hostId, userId)).all();
  const joined = db.select().from(rsvps).where(eq(rsvps.userId, userId)).all().filter((row) => row.status === "going");
  return { hosted: hosted.length, going: joined.length };
}
