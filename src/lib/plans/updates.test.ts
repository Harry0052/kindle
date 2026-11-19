import { describe, expect, it } from "vitest";
import { createMemberRecord } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { acceptInvite, createFriendInvite } from "@/lib/friends/service";
import { eq } from "drizzle-orm";
import { activities } from "@/lib/db/schema";
import { createActivity, getPlan, listHosted, listTonight, respondToPlan } from "./service";
import { changeStart, listMessages, listNotifications, postComment } from "./updates";

const profile = {
  timezone: "America/Chicago",
  homeRegion: "Lincoln Park",
  interests: ["basketball"],
  ageAttested: true,
};

function person(db: ReturnType<typeof createTestDb>, name: string, timezone = "America/Chicago") {
  const created = createMemberRecord(db, { ...profile, displayName: name, timezone });
  if (!created.ok) throw new Error(created.message);
  return created.user;
}

function futureLocal(hoursAhead = 30) {
  const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}T19:00`;
}

describe("plan updates", () => {
  it("tells people who are in when the time changes and hides past plans from Tonight", () => {
    const db = createTestDb();
    const host = person(db, "Avery Chen", "America/Chicago");
    const sam = person(db, "Sam Lee", "America/New_York");
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
    const changed = changeStart(db, host, created.plan.id, futureLocal(50));
    expect(changed.ok).toBe(true);
    const note = listNotifications(db, sam.id).find((item) => item.kind === "time_changed");
    expect(note?.body).toMatch(/Time changed/);
    const messages = listMessages(db, sam, created.plan.id) ?? [];
    expect(messages.some((message) => message.kind === "system")).toBe(true);
    const samView = getPlan(db, sam, created.plan.id);
    const hostView = getPlan(db, host, created.plan.id);
    expect(samView?.timeLabel).toBeTruthy();
    expect(hostView?.timeLabel).toBeTruthy();
    expect(samView?.timeLabel).not.toBe(hostView?.timeLabel);
    db.update(activities)
      .set({ startsAt: new Date(Date.now() - 60_000).toISOString() })
      .where(eq(activities.id, created.plan.id))
      .run();
    expect(listTonight(db, host).map((plan) => plan.id)).not.toContain(created.plan.id);
    expect(listHosted(db, host).map((plan) => plan.id)).toContain(created.plan.id);
  });

  it("lets people who are in comment and keeps the waitlist out of comments", () => {
    const db = createTestDb();
    const host = person(db, "Avery Chen");
    const sam = person(db, "Sam Lee");
    const riley = person(db, "Riley Chen");
    const created = createActivity(db, host, {
      title: "Soup night",
      category: "food",
      startsLocal: futureLocal(),
      capacity: 2,
      areaLabel: "Campus kitchen",
      exactLocation: "Side door",
      publish: true,
    });
    if (!created.ok) throw new Error(created.message);
    for (const friend of [sam, riley]) {
      const invite = createFriendInvite(db, host.id);
      expect(acceptInvite(db, friend.id, invite.token).ok).toBe(true);
    }
    expect(respondToPlan(db, sam, created.plan.id, "going").status).toBe("going");
    expect(respondToPlan(db, riley, created.plan.id, "going").status).toBe("waitlist");
    expect(postComment(db, sam, created.plan.id, "I can bring a ball.").ok).toBe(true);
    expect(postComment(db, riley, created.plan.id, "Can I still come?").ok).toBe(false);
    expect(listMessages(db, sam, created.plan.id)?.some((message) => message.body.includes("ball"))).toBe(true);
    expect(listMessages(db, riley, created.plan.id)?.some((message) => message.kind === "comment")).toBe(false);
  });
});