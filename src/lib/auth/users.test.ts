import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createMemberRecord, readUserByToken, revokeSession, updateProfile } from "./users";

const profile = {
  displayName: "Avery Chen",
  timezone: "America/Chicago",
  homeRegion: "Lincoln Park",
  interests: ["basketball"],
  ageAttested: true,
};

describe("profiles", () => {
  it("stores a member and restores them from the session token", () => {
    const db = createTestDb();
    const created = createMemberRecord(db, profile);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user.kind).toBe("member");
    expect(readUserByToken(db, created.token)?.displayName).toBe("Avery Chen");
    const row = db.select().from(users).where(eq(users.id, created.user.id)).get();
    expect(row?.ageAttested).toBe(1);
    expect(JSON.stringify(row)).not.toContain(created.token);
  });

  it("refuses a profile that does not attest 18+", () => {
    const db = createTestDb();
    const created = createMemberRecord(db, { ...profile, ageAttested: false });
    expect(created.ok).toBe(false);
  });

  it("updates the saved name and drops the session on logout", () => {
    const db = createTestDb();
    const created = createMemberRecord(db, profile);
    if (!created.ok) throw new Error("expected profile");
    const updated = updateProfile(db, created.user.id, { ...profile, displayName: "Avery C." });
    expect(updated.ok).toBe(true);
    revokeSession(db, created.token);
    expect(readUserByToken(db, created.token)).toBeNull();
  });
});
