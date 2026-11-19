import { randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import type { PublicUser } from "@/lib/auth/users";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import { activities, blocks, friendEdges, reports, rsvps } from "@/lib/db/schema";
import { findEdge, isBlocked, orderedPair } from "@/lib/friends/service";
import { releaseGoingSlot } from "@/lib/plans/capacity";
import { notifyParticipants } from "@/lib/plans/updates";
import { canSeeActivity, getPlan } from "@/lib/plans/service";
import { nowIso, zonedLocalToUtc } from "@/lib/time";

const REASONS = ["uncomfortable", "spam", "safety", "other"] as const;

export function blockPerson(db: KindleDb, actor: PublicUser, blockedId: string) {
  if (actor.id === blockedId) return { ok: false as const, message: "You cannot block yourself." };
  if (isBlocked(db, actor.id, blockedId)) return { ok: true as const, already: true };
  const now = nowIso();
  db.insert(blocks)
    .values({ id: randomUUID(), blockerId: actor.id, blockedId, createdAt: now })
    .run();
  const edge = findEdge(db, actor.id, blockedId);
  if (edge && edge.status === "accepted") {
    db.update(friendEdges).set({ status: "declined", updatedAt: now }).where(eq(friendEdges.id, edge.id)).run();
  }
  releaseBetween(db, actor.id, blockedId, now);
  recordEvent(db, actor.id, "user_blocked", {});
  return { ok: true as const, already: false };
}

function releaseBetween(db: KindleDb, actorId: string, otherId: string, now: string) {
  const rows = db
    .select({ activity: activities, rsvp: rsvps })
    .from(rsvps)
    .innerJoin(activities, eq(activities.id, rsvps.activityId))
    .where(
      and(
        eq(rsvps.status, "going"),
        or(
          and(eq(activities.hostId, actorId), eq(rsvps.userId, otherId)),
          and(eq(activities.hostId, otherId), eq(rsvps.userId, actorId)),
        ),
      ),
    )
    .all();
  for (const row of rows) {
    releaseGoingSlot(db.$client, row.activity.id, now);
    db.update(rsvps).set({ status: "left", updatedAt: now }).where(eq(rsvps.id, row.rsvp.id)).run();
  }
}

export function leavePlan(db: KindleDb, viewer: PublicUser, activityId: string) {
  const plan = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!plan || plan.hostId === viewer.id) return { ok: false as const, message: "Hosts cancel a plan instead of leaving it." };
  if (!canSeeActivity(db, viewer, plan)) return { ok: false as const, message: "Kindle cannot show that plan." };
  const existing = db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.activityId, activityId), eq(rsvps.userId, viewer.id)))
    .get();
  const now = nowIso();
  if (existing?.status === "going") releaseGoingSlot(db.$client, activityId, now);
  if (existing) {
    db.update(rsvps).set({ status: "left", updatedAt: now }).where(eq(rsvps.id, existing.id)).run();
  } else {
    db.insert(rsvps)
      .values({ id: randomUUID(), activityId, userId: viewer.id, status: "left", createdAt: now, updatedAt: now })
      .run();
  }
  notifyParticipants(db, activityId, "left", `${viewer.displayName} left ${plan.title}.`, viewer.id);
  recordEvent(db, viewer.id, "activity_left", {});
  return { ok: true as const };
}

export function cancelPlan(db: KindleDb, host: PublicUser, activityId: string) {
  const plan = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!plan || plan.hostId !== host.id) return { ok: false as const, message: "Kindle cannot show that plan." };
  if (plan.status === "cancelled") return { ok: true as const, already: true };
  const now = nowIso();
  notifyParticipants(db, activityId, "cancelled", `${host.displayName} cancelled ${plan.title}. The exact spot is hidden.`, host.id);
  db.update(activities).set({ status: "cancelled", goingCount: 0, updatedAt: now }).where(eq(activities.id, activityId)).run();
  db.update(rsvps)
    .set({ status: "cancelled", updatedAt: now })
    .where(and(eq(rsvps.activityId, activityId), or(eq(rsvps.status, "going"), eq(rsvps.status, "waitlist"), eq(rsvps.status, "declined"))))
    .run();
  recordEvent(db, host.id, "activity_cancelled", {});
  return { ok: true as const, already: false };
}

export function duplicatePlan(db: KindleDb, host: PublicUser, activityId: string, startsLocal: string) {
  const plan = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!plan || plan.hostId !== host.id) return { ok: false as const, message: "Kindle cannot show that plan." };
  const startsAt = zonedLocalToUtc(startsLocal, host.timezone);
  if (!startsAt || Date.parse(startsAt) <= Date.now()) return { ok: false as const, message: "Choose a future time for the new plan." };
  const now = nowIso();
  const id = randomUUID();
  db.insert(activities)
    .values({
      id,
      hostId: host.id,
      title: plan.title,
      category: plan.category,
      startsAt,
      capacity: plan.capacity,
      visibility: "friends",
      areaLabel: plan.areaLabel,
      exactLocation: plan.exactLocation,
      status: "draft",
      demo: 0,
      sourceActivityId: plan.id,
      idempotencyKey: null,
      goingCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  recordEvent(db, host.id, "activity_duplicated", {});
  return { ok: true as const, plan: getPlan(db, host, id) };
}

export function fileReport(
  db: KindleDb,
  reporter: PublicUser,
  input: { subjectType: string; subjectId: string; reason: string },
) {
  if (!REASONS.includes(input.reason as (typeof REASONS)[number])) {
    return { ok: false as const, message: "Choose a reason." };
  }
  if (!["user", "activity", "message"].includes(input.subjectType)) {
    return { ok: false as const, message: "That report subject is not supported." };
  }
  const reason = input.reason.slice(0, 40);
  const subjectId = input.subjectId.slice(0, 80);
  db.insert(reports)
    .values({
      id: randomUUID(),
      reporterId: reporter.id,
      subjectType: input.subjectType,
      subjectId,
      reason,
      createdAt: nowIso(),
    })
    .run();
  recordEvent(db, reporter.id, "report_filed", { subjectType: input.subjectType });
  return {
    ok: true as const,
    message: "Saved on this server. Kindle does not have a review team connected, so nobody is notified automatically.",
  };
}

export const pairForBlock = orderedPair;
