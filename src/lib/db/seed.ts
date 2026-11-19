import { eq } from "drizzle-orm";
import type { KindleDb } from "./client";
import { users } from "./schema";
import { nowIso } from "@/lib/time";

export const DEMO_USER_ID = "demo-jordan";

export function seedDemo(db: KindleDb) {
  const existing = db.select().from(users).where(eq(users.kind, "demo")).get();
  if (existing) return;
  db.insert(users)
    .values({
      id: DEMO_USER_ID,
      displayName: "Demo Jordan",
      timezone: "America/New_York",
      ageAttested: 1,
      kind: "demo",
      createdAt: nowIso(),
    })
    .run();
}
