import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createMemberRecord } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { activities, reports, rsvps } from "@/lib/db/schema";
import { acceptInvite, createFriendInvite } from "@/lib/friends/service";
import { createActivity, getPlan, respondToPlan } from "./service";
import { blockPerson, cancelPlan, duplicatePlan, fileReport, leavePlan } from "./safety";
import { postComment } from "./updates";

const profile = {
  timezone: "UTC",
  homeRegion: "Lincoln Park",
  interests: ["basketball"],
  ageAttested: true,
};

function person(db: ReturnType<typeof createTestDb>, name: string) {
  const created = createMemberRecord(db, { ...profile, displayName: name });
  if (!created.ok) throw new Error(created.message);
  return created.user;
}

function futureLocal() {
  const date = new Date(Date.now() + 36 * 60 * 60 * 1000);
  return `${date.toISOString().slice(0, 10)}T19:00`;
}

describe("safety", () => {
  it("hides plans and stops comments as soon as someone is blocked", () => {
    const db = createTestDb();
    const host = person(db, "Avery Chen");
    const sam = person(db, "Sam Lee");
    const created = createActivity(db, host, {
      title: "Basketball tonight",
      category: "sport",
      startsLocal: futureLocal(),
      capacity: 4,
      areaLabel: "Riverside courts",
      exactLocation: "North gate",
      publish: true,
    });
    if (!created.ok) throw new Error(created.message);
    const invite = createFriendInvite(db, host.id);
    expect(acceptInvite(db, sam.id, invite.token).ok).toBe(true);
    expect(respondToPlan(db, sam, created.plan.id, "going").status).toBe("going");
    expect(blockPerson(db, host, sam.id).ok).toBe(true);
    expect(getPlan(db, sam, created.plan.id)).toBeNull();
    expect(postComment(db, sam, created.plan.id, "Still here?").ok).toBe(false);
    const again = createFriendInvite(db, host.id);
    expect(acceptInvite(db, sam.id, again.token).ok).toBe(false);
    expect(db.select().from(activities).where(eq(activities.id, created.plan.id)).get()?.goingCount).toBe(1);
  });

  it("cancels every RSVP, hides the spot, and copies a plan without the guest list", () => {
    const db = createTestDb();
    const host = person(db, "Avery Chen");
    const sam = person(db, "Sam Lee");
    const created = createActivity(db, host, {
      title: "Soup night",
      category: "food",
      startsLocal: futureLocal(),
      capacity: 4,
      areaLabel: "Campus kitchen",
      exactLocation: "Side door",
      publish: true,
    });
    if (!created.ok) throw new Error(created.message);
    const invite = createFriendInvite(db, host.id);
    expect(acceptInvite(db, sam.id, invite.token).ok).toBe(true);
    expect(respondToPlan(db, sam, created.plan.id, "going").status).toBe("going");
    expect(cancelPlan(db, host, created.plan.id).ok).toBe(true);
    const samRsvp = db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.activityId, created.plan.id), eq(rsvps.userId, sam.id)))
      .get();
    expect(samRsvp?.status).toBe("cancelled");
    expect(db.select().from(activities).where(eq(activities.id, created.plan.id)).get()?.goingCount).toBe(0);
    expect(getPlan(db, sam, created.plan.id)?.exactLocation).toBeNull();
    const copy = duplicatePlan(db, host, created.plan.id, futureLocal());
    expect(copy.ok).toBe(true);
    if (!copy.ok || !copy.plan) return;
    expect(copy.plan.status).toBe("draft");
    expect(copy.plan.id).not.toBe(created.plan.id);
    expect(db.select().from(rsvps).where(eq(rsvps.activityId, copy.plan.id)).all()).toEqual([]);
    const filed = fileReport(db, sam, { subjectType: "activity", subjectId: created.plan.id, reason: "safety" });
    expect(filed.ok).toBe(true);
    expect(filed.message).toMatch(/nobody is notified/i);
    expect(db.select().from(reports).all()).toHaveLength(1);
    expect(leavePlan(db, sam, created.plan.id).ok).toBe(true);
  });
});