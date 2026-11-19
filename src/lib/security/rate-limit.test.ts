import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/db/client";
import { consumeRateLimit } from "./rate-limit";

describe("consumeRateLimit", () => {
  it("allows the budget and then refuses", () => {
    const db = createTestDb();
    expect(consumeRateLimit(db, "profile:test", 2, 60_000, 1_000)).toBe(true);
    expect(consumeRateLimit(db, "profile:test", 2, 60_000, 1_500)).toBe(true);
    expect(consumeRateLimit(db, "profile:test", 2, 60_000, 2_000)).toBe(false);
    expect(consumeRateLimit(db, "profile:test", 2, 60_000, 61_000)).toBe(true);
  });
});
