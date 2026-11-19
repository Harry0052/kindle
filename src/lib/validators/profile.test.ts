import { describe, expect, it } from "vitest";
import { profileSchema } from "./profile";

describe("profileSchema", () => {
  it("accepts a name, timezone, and adult attestation", () => {
    const parsed = profileSchema.safeParse({
      displayName: "Avery Chen",
      timezone: "America/Chicago",
      ageAttested: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a missing attestation, an email-shaped name, and a bad timezone", () => {
    const parsed = profileSchema.safeParse({
      displayName: "avery@example.com",
      timezone: "Not/AZone",
      ageAttested: false,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((issue) => String(issue.path[0]));
      expect(fields).toContain("displayName");
      expect(fields).toContain("timezone");
      expect(fields).toContain("ageAttested");
    }
  });
});
