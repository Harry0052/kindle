import { describe, expect, it } from "vitest";
import { formatInZone, formatTimeInZone, zonedLocalToUtc } from "./time";

describe("timezone display", () => {
  it("shows a UTC instant in the viewer's timezone", () => {
    const iso = "2026-06-01T23:00:00.000Z";
    const chicago = formatTimeInZone(iso, "America/Chicago");
    const london = formatTimeInZone(iso, "Europe/London");
    expect(chicago).toMatch(/6:00/);
    expect(chicago.toLowerCase()).toMatch(/pm/);
    expect(london).toMatch(/12:00/);
    expect(formatInZone(iso, "America/Chicago")).toContain("2026");
  });

  it("converts a wall-clock time back to UTC", () => {
    const utc = zonedLocalToUtc("2026-06-01T19:00", "America/New_York");
    expect(utc).toBe("2026-06-01T23:00:00.000Z");
    expect(zonedLocalToUtc("not-a-time", "America/New_York")).toBeNull();
  });
});
