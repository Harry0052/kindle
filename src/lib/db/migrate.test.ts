import { describe, expect, it } from "vitest";
import { createTestDb } from "./client";
import { users } from "./schema";

describe("migrations", () => {
  it("creates the profile tables", () => {
    const db = createTestDb();
    const rows = db.select().from(users).all();
    expect(rows).toEqual([]);
  });
});
