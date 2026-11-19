import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createMemberRecord } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { activities } from "@/lib/db/schema";
import { acceptInvite, createFriendInvite } from "@/lib/friends/service";
import { createActivity, getPlan, respondToPlan } from "./service";

const profile = {
  timezone: "America/New_York",
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
  const date = new Date(Date.now() + 30 * 60 * 60 * 1000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}T19:00`;
}

describe("rsvp capacity", () => {
  it("shows the exact spot only after a going RSVP and waitlists overflow honestly", () => {
    const db = createTestDb();
    const host = person(db, "Avery Chen");
    const sam = person(db, "Sam Lee");
    const riley = person(db, "Riley Chen");
    const created = createActivity(db, host, {
      title: "Basketball tonight",
      category: "sport",
      startsLocal: futureLocal(),
      capacity: 2,
      areaLabel: "Riverside courts",
      exactLocation: "North gate, court 2",
      publish: true,
    });
    if (!created.ok) throw new Error(created.message);
    for (const friend of [sam, riley]) {
      const invite = createFriendInvite(db, host.id);
      expect(acceptInvite(db, friend.id, invite.token).ok).toBe(true);
    }
    expect(getPlan(db, sam, created.plan.id)?.exactLocation).toBeNull();
    const first = respondToPlan(db, sam, created.plan.id, "going");
    expect(first.status).toBe("going");
    expect(first.plan?.exactLocation).toBe("North gate, court 2");
    const second = respondToPlan(db, riley, created.plan.id, "going");
    expect(second.status).toBe("waitlist");
    expect(second.message).toMatch(/does not hold|is not held|not held/i);
    expect(second.plan?.exactLocation).toBeNull();
    const stored = db.select().from(activities).where(eq(activities.id, created.plan.id)).get();
    expect(stored?.goingCount).toBe(2);
    const again = respondToPlan(db, sam, created.plan.id, "going");
    expect(again.status).toBe("going");
    expect(db.select().from(activities).where(eq(activities.id, created.plan.id)).get()?.goingCount).toBe(2);
  });
});
