import { describe, expect, it } from "vitest";
import { createMemberRecord } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { activities, users } from "@/lib/db/schema";
import { acceptInvite, createFriendInvite } from "@/lib/friends/service";
import { seedDemo } from "@/lib/db/seed";
import { nowIso } from "@/lib/time";
import { createActivity, getPlan, listTonight } from "./service";

const baseProfile = {
  timezone: "America/Chicago",
  homeRegion: "Lincoln Park",
  interests: ["basketball"],
  ageAttested: true,
};

function member(db: ReturnType<typeof createTestDb>, name: string) {
  const created = createMemberRecord(db, { ...baseProfile, displayName: name });
  if (!created.ok) throw new Error(created.message);
  return created;
}

function futureLocal() {
  const date = new Date(Date.now() + 26 * 60 * 60 * 1000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}T19:00`;
}

describe("private activities", () => {
  it("hides a friends-only plan, including the exact spot, from someone who is not a friend", () => {
    const db = createTestDb();
    const host = member(db, "Avery Chen");
    const stranger = member(db, "Blake Ortiz");
    const created = createActivity(db, host.user, {
      title: "Basketball tonight",
      category: "sport",
      startsLocal: futureLocal(),
      capacity: 6,
      areaLabel: "Riverside courts",
      exactLocation: "North gate, court 2",
      publish: true,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(getPlan(db, stranger.user, created.plan.id)).toBeNull();
    expect(listTonight(db, stranger.user)).toEqual([]);
    const friendInvite = createFriendInvite(db, host.user.id);
    const accepted = acceptInvite(db, stranger.user.id, friendInvite.token);
    expect(accepted.ok).toBe(true);
    const visible = getPlan(db, stranger.user, created.plan.id);
    expect(visible?.areaLabel).toBe("Riverside courts");
    expect(visible?.exactLocation).toBeNull();
    expect(visible?.exactHidden).toBe(true);
    expect(getPlan(db, host.user, created.plan.id)?.exactLocation).toBe("North gate, court 2");
  });

  it("keeps drafts and demo plans off a real person's tonight list", () => {
    const db = createTestDb();
    seedDemo(db);
    const host = member(db, "Avery Chen");
    createActivity(db, host.user, {
      title: "Coffee draft",
      category: "food",
      startsLocal: futureLocal(),
      capacity: 2,
      areaLabel: "Campus cafe area",
      exactLocation: "",
      publish: false,
    });
    db.insert(activities)
      .values({
        id: "demo-visible-check",
        hostId: "demo-jordan",
        title: "DEMO · Evening run",
        category: "sport",
        startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        capacity: 4,
        visibility: "friends",
        areaLabel: "Riverside",
        exactLocation: "North gate",
        status: "published",
        demo: 1,
        idempotencyKey: null,
        goingCount: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();
    const tonight = listTonight(db, host.user);
    expect(tonight).toEqual([]);
    expect(db.select().from(users).all().some((user) => user.kind === "demo")).toBe(true);
  });

  it("rejects a street address in the public area", () => {
    const db = createTestDb();
    const host = member(db, "Avery Chen");
    const created = createActivity(db, host.user, {
      title: "Basketball tonight",
      category: "sport",
      startsLocal: futureLocal(),
      capacity: 4,
      areaLabel: "12 Oak Street",
      exactLocation: "North gate",
      publish: true,
    });
    expect(created.ok).toBe(false);
  });
});
