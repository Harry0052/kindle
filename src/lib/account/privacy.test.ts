import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createMemberRecord, readUserByToken } from "@/lib/auth/users";
import { createTestDb } from "@/lib/db/client";
import { activities, users } from "@/lib/db/schema";
import { deleteAccount, exportAccount } from "./privacy";
import { createActivity } from "@/lib/plans/service";

describe("account privacy", () => {
  it("exports the host spot and then scrubs the profile", () => {
    const db = createTestDb();
    const created = createMemberRecord(db, {
      displayName: "Avery Chen",
      timezone: "UTC",
      homeRegion: "Lincoln Park",
      interests: ["basketball"],
      ageAttested: true,
    });
    if (!created.ok) throw new Error(created.message);
    const plan = createActivity(db, created.user, {
      title: "Basketball tonight",
      category: "sport",
      startsLocal: "2026-12-01T19:00",
      capacity: 4,
      areaLabel: "Riverside courts",
      exactLocation: "North gate",
      publish: true,
    });
    if (!plan.ok) throw new Error(plan.message);
    const exported = exportAccount(db, created.user);
    expect(exported.activities[0]?.exactLocation).toBe("North gate");
    expect(exported.profile.displayName).toBe("Avery Chen");
    deleteAccount(db, created.user);
    expect(readUserByToken(db, created.token)).toBeNull();
    expect(db.select().from(users).where(eq(users.id, created.user.id)).get()?.displayName).toBe("Deleted member");
    expect(db.select().from(activities).where(eq(activities.id, plan.plan.id)).get()?.exactLocation).toBeNull();
  });
});
