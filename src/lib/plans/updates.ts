import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { PublicUser } from "@/lib/auth/users";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import { activityMessages, activities, notifications, rsvps, users } from "@/lib/db/schema";
import { formatInZone, nowIso, zonedLocalToUtc } from "@/lib/time";
import { canSeeActivity, getPlan } from "@/lib/plans/service";

const MAX_AHEAD_MS = 180 * 24 * 60 * 60 * 1000;

export type PlanMessage = {
  id: string;
  body: string;
  kind: "comment" | "system";
  createdAt: string;
  authorName: string;
};

function role(db: KindleDb, activityId: string, userId: string, hostId: string) {
  if (userId === hostId) return "host";
  return db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.activityId, activityId), eq(rsvps.userId, userId)))
    .get()?.status ?? "none";
}

export function notifyParticipants(db: KindleDb, activityId: string, kind: string, body: string, exceptUserId?: string) {
  const people = db
    .select()
    .from(rsvps)
    .where(eq(rsvps.activityId, activityId))
    .all()
    .filter((row) => row.status === "going" || row.status === "waitlist")
    .filter((row) => row.userId !== exceptUserId);
  const now = nowIso();
  for (const person of people) {
    db.insert(notifications)
      .values({
        id: randomUUID(),
        userId: person.userId,
        activityId,
        kind,
        body: body.slice(0, 180),
        createdAt: now,
        readAt: null,
      })
      .run();
  }
}

export function changeStart(db: KindleDb, host: PublicUser, activityId: string, startsLocal: string) {
  const row = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!row || row.hostId !== host.id) return { ok: false as const, message: "Kindle cannot show that plan." };
  if (row.status === "cancelled") return { ok: false as const, message: "This plan is cancelled." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsLocal)) {
    return { ok: false as const, message: "Choose a date and time." };
  }
  const startsAt = zonedLocalToUtc(startsLocal, host.timezone);
  if (!startsAt) return { ok: false as const, message: "That time does not exist in your timezone." };
  const startMs = Date.parse(startsAt);
  if (startMs <= Date.now()) return { ok: false as const, message: "Choose a time in the future." };
  if (startMs > Date.now() + MAX_AHEAD_MS) return { ok: false as const, message: "Choose a time within the next 180 days." };
  const now = nowIso();
  const label = formatInZone(startsAt, host.timezone);
  db.update(activities).set({ startsAt, updatedAt: now }).where(eq(activities.id, activityId)).run();
  db.insert(activityMessages)
    .values({
      id: randomUUID(),
      activityId,
      userId: host.id,
      body: `The time is now ${label}. Kindle does not text or email this.`,
      kind: "system",
      createdAt: now,
    })
    .run();
  notifyParticipants(db, activityId, "time_changed", `Time changed for ${row.title}.`, host.id);
  recordEvent(db, host.id, "activity_time_changed", {});
  return { ok: true as const, plan: getPlan(db, host, activityId) };
}

export function postComment(db: KindleDb, viewer: PublicUser, activityId: string, body: string) {
  const text = body.trim();
  if (text.length < 1 || text.length > 500) return { ok: false as const, message: "Write between 1 and 500 characters." };
  const row = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!row || !canSeeActivity(db, viewer, row) || row.status !== "published") {
    return { ok: false as const, message: "Kindle cannot show that plan." };
  }
  const mine = role(db, activityId, viewer.id, row.hostId);
  if (mine !== "host" && mine !== "going") {
    return { ok: false as const, message: "Only people who are in can comment." };
  }
  const now = nowIso();
  db.insert(activityMessages)
    .values({ id: randomUUID(), activityId, userId: viewer.id, body: text, kind: "comment", createdAt: now })
    .run();
  notifyParticipants(db, activityId, "comment", `${viewer.displayName} commented on ${row.title}.`, viewer.id);
  recordEvent(db, viewer.id, "activity_comment", {});
  return { ok: true as const };
}

export function listMessages(db: KindleDb, viewer: PublicUser, activityId: string): PlanMessage[] | null {
  const row = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!row || !canSeeActivity(db, viewer, row)) return null;
  const mine = role(db, activityId, viewer.id, row.hostId);
  const canReadComments = mine === "host" || mine === "going";
  const canReadSystem = canReadComments || mine === "waitlist";
  if (!canReadSystem) return [];
  return db
    .select()
    .from(activityMessages)
    .where(eq(activityMessages.activityId, activityId))
    .all()
    .filter((message) => (message.kind === "comment" ? canReadComments : canReadSystem))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((message) => ({
      id: message.id,
      body: message.body,
      kind: message.kind === "system" ? "system" : "comment",
      createdAt: message.createdAt,
      authorName: db.select().from(users).where(eq(users.id, message.userId)).get()?.displayName ?? "Someone",
    }));
}

export function listNotifications(db: KindleDb, userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .all()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
}

export function isPast(iso: string, now = new Date()) {
  return Date.parse(iso) < now.getTime();
}
