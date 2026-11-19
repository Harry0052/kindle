import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { PublicUser } from "@/lib/auth/users";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import { activities, rsvps, users } from "@/lib/db/schema";
import { CLAIM_SQL, RELEASE_SQL } from "@/lib/plans/capacity";
import type Database from "better-sqlite3";
import { areFriends, isBlocked } from "@/lib/friends/service";
import { formatInZone, formatTimeInZone, nowIso, zonedLocalToUtc } from "@/lib/time";
import { activitySchema, type ActivityInput, type Category } from "@/lib/validators/activity";
import { profileReady } from "@/lib/validators/profile";

const MAX_AHEAD_MS = 180 * 24 * 60 * 60 * 1000;

export type PlanView = {
  id: string;
  title: string;
  category: Category;
  startsAt: string;
  timeLabel: string;
  clockLabel: string;
  capacity: number;
  areaLabel: string;
  exactLocation: string | null;
  exactHidden: boolean;
  status: string;
  hostId: string;
  hostName: string;
  demo: boolean;
  viewerIsHost: boolean;
  goingCount: number;
  viewerStatus: "host" | "going" | "waitlist" | "declined" | "left" | "none";
  roster: string[];
};

function asCategory(value: string): Category {
  if (value === "sport" || value === "food" || value === "hobby") return value;
  return "hobby";
}

function viewerStatusFor(row: typeof activities.$inferSelect, viewerId: string, rsvpStatus: string | null) {
  if (row.hostId === viewerId) return "host" as const;
  if (rsvpStatus === "going" || rsvpStatus === "waitlist" || rsvpStatus === "declined" || rsvpStatus === "left") {
    return rsvpStatus;
  }
  return "none" as const;
}

function present(
  db: KindleDb,
  row: typeof activities.$inferSelect,
  hostName: string,
  viewer: PublicUser,
): PlanView {
  const mine = db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.activityId, row.id), eq(rsvps.userId, viewer.id)))
    .get();
  const status = viewerStatusFor(row, viewer.id, mine?.status ?? null);
  const reveal = status === "host" || (status === "going" && row.status === "published");
  const going = db.select().from(rsvps).where(and(eq(rsvps.activityId, row.id), eq(rsvps.status, "going"))).all();
  const names = going
    .map((rsvp) => db.select().from(users).where(eq(users.id, rsvp.userId)).get()?.displayName)
    .filter((name): name is string => Boolean(name));
  return {
    id: row.id,
    title: row.title,
    category: asCategory(row.category),
    startsAt: row.startsAt,
    timeLabel: formatInZone(row.startsAt, viewer.timezone),
    clockLabel: formatTimeInZone(row.startsAt, viewer.timezone),
    capacity: row.capacity,
    areaLabel: row.areaLabel,
    exactLocation: reveal ? row.exactLocation || null : null,
    exactHidden: !reveal,
    status: row.status,
    hostId: row.hostId,
    hostName,
    demo: row.demo === 1,
    viewerIsHost: status === "host",
    goingCount: row.goingCount,
    viewerStatus: status,
    roster: names,
  };
}

function seatHost(db: KindleDb, activityId: string, hostId: string, now: string) {
  const existing = db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.activityId, activityId), eq(rsvps.userId, hostId)))
    .get();
  if (!existing) {
    db.insert(rsvps)
      .values({
        id: randomUUID(),
        activityId,
        userId: hostId,
        status: "going",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
  db.update(activities).set({ goingCount: 1, status: "published", updatedAt: now }).where(eq(activities.id, activityId)).run();
}

export function canSeeActivity(db: KindleDb, viewer: PublicUser, row: typeof activities.$inferSelect) {
  if (row.demo === 1 && viewer.kind !== "demo") return false;
  if (viewer.kind === "deleted") return false;
  if (isBlocked(db, viewer.id, row.hostId)) return false;
  if (row.hostId === viewer.id) return true;
  if (row.status === "draft") return false;
  return areFriends(db, viewer.id, row.hostId);
}

function hostName(db: KindleDb, hostId: string) {
  return db.select().from(users).where(eq(users.id, hostId)).get()?.displayName ?? "Host";
}

export function createActivity(db: KindleDb, host: PublicUser, input: ActivityInput) {
  if (!profileReady(host)) {
    return { ok: false as const, message: "Add your area and at least one interest before hosting." };
  }
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the plan." };
  }
  if (parsed.data.idempotencyKey) {
    const prior = db
      .select()
      .from(activities)
      .where(and(eq(activities.hostId, host.id), eq(activities.idempotencyKey, parsed.data.idempotencyKey)))
      .get();
    if (prior) return { ok: true as const, plan: present(db, prior, host.displayName, host), replayed: true };
  }
  const startsAt = zonedLocalToUtc(parsed.data.startsLocal, host.timezone);
  if (!startsAt) return { ok: false as const, message: "That time does not exist in your timezone." };
  const startMs = Date.parse(startsAt);
  if (startMs <= Date.now()) return { ok: false as const, message: "Choose a time in the future." };
  if (startMs > Date.now() + MAX_AHEAD_MS) return { ok: false as const, message: "Choose a time within the next 180 days." };
  const now = nowIso();
  const id = randomUUID();
  const exact = parsed.data.exactLocation.trim();
  db.insert(activities)
    .values({
      id,
      hostId: host.id,
      title: parsed.data.title,
      category: parsed.data.category,
      startsAt,
      capacity: parsed.data.capacity,
      visibility: "friends",
      areaLabel: parsed.data.areaLabel,
      exactLocation: exact.length > 0 ? exact : null,
      status: parsed.data.publish ? "published" : "draft",
      demo: 0,
      idempotencyKey: parsed.data.idempotencyKey ?? null,
      goingCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  if (parsed.data.publish) seatHost(db, id, host.id, now);
  recordEvent(db, host.id, parsed.data.publish ? "activity_published" : "activity_drafted", { category: parsed.data.category });
  const row = db.select().from(activities).where(eq(activities.id, id)).get();
  if (!row) return { ok: false as const, message: "Kindle could not store that plan." };
  return { ok: true as const, plan: present(db, row, host.displayName, host), replayed: false };
}

export function publishActivity(db: KindleDb, host: PublicUser, activityId: string) {
  const row = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!row || row.hostId !== host.id) return { ok: false as const, message: "Kindle cannot show that plan." };
  if (row.status === "published") return { ok: true as const, plan: present(db, row, host.displayName, host) };
  if (Date.parse(row.startsAt) <= Date.now()) {
    return { ok: false as const, message: "That time has passed. Set a new time before publishing." };
  }
  seatHost(db, activityId, host.id, nowIso());
  recordEvent(db, host.id, "activity_published", {});
  const next = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!next) return { ok: false as const, message: "Kindle could not publish that plan." };
  return { ok: true as const, plan: present(db, next, host.displayName, host) };
}

export function getPlan(db: KindleDb, viewer: PublicUser, activityId: string) {
  const row = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!row || !canSeeActivity(db, viewer, row)) return null;
  return present(db, row, hostName(db, row.hostId), viewer);
}

export function listTonight(db: KindleDb, viewer: PublicUser, options: { now?: Date; category?: string } = {}) {
  const now = (options.now ?? new Date()).toISOString();
  const rows = db
    .select()
    .from(activities)
    .where(eq(activities.status, "published"))
    .all()
    .filter((row) => row.startsAt >= now)
    .filter((row) => !options.category || row.category === options.category)
    .filter((row) => canSeeActivity(db, viewer, row))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return rows.map((row) => present(db, row, hostName(db, row.hostId), viewer));
}

export function listHosted(db: KindleDb, viewer: PublicUser) {
  return db
    .select()
    .from(activities)
    .where(eq(activities.hostId, viewer.id))
    .all()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((row) => present(db, row, viewer.displayName, viewer));
}

export function listAttending(db: KindleDb, viewer: PublicUser) {
  const ids = db
    .select()
    .from(rsvps)
    .where(eq(rsvps.userId, viewer.id))
    .all()
    .filter((row) => row.status === "going" || row.status === "waitlist")
    .map((row) => row.activityId);
  return db
    .select()
    .from(activities)
    .all()
    .filter((row) => ids.includes(row.id) && row.hostId !== viewer.id && canSeeActivity(db, viewer, row))
    .map((row) => present(db, row, hostName(db, row.hostId), viewer));
}

export function respondToPlan(db: KindleDb, viewer: PublicUser, activityId: string, intent: "going" | "declined") {
  const row = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!row || !canSeeActivity(db, viewer, row) || row.status !== "published") {
    return { ok: false as const, message: "Kindle cannot show that plan." };
  }
  if (row.hostId === viewer.id) {
    return { ok: false as const, message: "You are hosting, so your spot stays taken." };
  }
  const now = nowIso();
  const sqlite = db.$client;
  const status = sqlite.transaction(() => {
    const existing = sqlite
      .prepare("SELECT status FROM rsvps WHERE activity_id = ? AND user_id = ?")
      .get(activityId, viewer.id) as { status: string } | undefined;
    if (intent === "declined") {
      if (existing?.status === "going") sqlite.prepare(RELEASE_SQL).run(now, activityId);
      writeRsvp(sqlite, activityId, viewer.id, "declined", now);
      return "declined" as const;
    }
    if (existing?.status === "going") return "going" as const;
    const claimed = sqlite.prepare(CLAIM_SQL).run(now, activityId).changes === 1;
    const next = claimed ? "going" : "waitlist";
    writeRsvp(sqlite, activityId, viewer.id, next, now);
    return next;
  }).immediate();
  recordEvent(db, viewer.id, status === "going" ? "rsvp_going" : status === "waitlist" ? "rsvp_waitlist" : "rsvp_declined", {});
  return {
    ok: true as const,
    status,
    plan: getPlan(db, viewer, activityId),
    message:
      status === "waitlist" ? "This plan is full. You are on the waitlist, and a spot is not held." : undefined,
  };
}

function writeRsvp(sqlite: Database.Database, activityId: string, userId: string, status: string, now: string) {
  const existing = sqlite.prepare("SELECT id FROM rsvps WHERE activity_id = ? AND user_id = ?").get(activityId, userId) as
    | { id: string }
    | undefined;
  if (existing) {
    sqlite.prepare("UPDATE rsvps SET status = ?, updated_at = ? WHERE id = ?").run(status, now, existing.id);
    return;
  }
  sqlite.prepare("INSERT INTO rsvps (id, activity_id, user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    randomUUID(),
    activityId,
    userId,
    status,
    now,
    now,
  );
}
