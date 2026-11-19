import { eq } from "drizzle-orm";
import type { KindleDb } from "./client";
import { activities, friendEdges, userInterests, users } from "./schema";
import { nowIso } from "@/lib/time";

export const DEMO_JORDAN_ID = "demo-jordan";
export const DEMO_SAM_ID = "demo-sam";
export const DEMO_ACTIVITY_ID = "demo-evening-run";

export function seedDemo(db: KindleDb) {
  const now = nowIso();
  const jordan = db.select().from(users).where(eq(users.id, DEMO_JORDAN_ID)).get();
  if (!jordan) {
    db.insert(users)
      .values({
        id: DEMO_JORDAN_ID,
        displayName: "Demo Jordan",
        timezone: "America/New_York",
        ageAttested: 1,
        homeRegion: "Riverside",
        kind: "demo",
        createdAt: now,
      })
      .run();
    db.insert(userInterests).values({ userId: DEMO_JORDAN_ID, interest: "running" }).run();
  }
  const sam = db.select().from(users).where(eq(users.id, DEMO_SAM_ID)).get();
  if (!sam) {
    db.insert(users)
      .values({
        id: DEMO_SAM_ID,
        displayName: "Demo Sam",
        timezone: "America/New_York",
        ageAttested: 1,
        homeRegion: "Riverside",
        kind: "demo",
        createdAt: now,
      })
      .run();
    db.insert(userInterests).values({ userId: DEMO_SAM_ID, interest: "running" }).run();
  }
  const edge = db.select().from(friendEdges).where(eq(friendEdges.id, "demo-edge")).get();
  if (!edge) {
    db.insert(friendEdges)
      .values({
        id: "demo-edge",
        userLow: DEMO_JORDAN_ID,
        userHigh: DEMO_SAM_ID,
        requesterId: DEMO_JORDAN_ID,
        status: "accepted",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
  const activity = db.select().from(activities).where(eq(activities.id, DEMO_ACTIVITY_ID)).get();
  if (!activity) {
    db.insert(activities)
      .values({
        id: DEMO_ACTIVITY_ID,
        hostId: DEMO_JORDAN_ID,
        title: "DEMO · Evening run",
        category: "sport",
        startsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        capacity: 4,
        visibility: "friends",
        areaLabel: "Riverside path",
        exactLocation: "North gate",
        status: "published",
        demo: 1,
        idempotencyKey: null,
        goingCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
}
