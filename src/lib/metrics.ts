import { eq } from "drizzle-orm";
import type { KindleDb } from "@/lib/db/client";
import { activities, rsvps, users } from "@/lib/db/schema";

/**
 * Counts stored on this server. This is not a live product metric and it
 * includes demo rows if they are present. Do not publish it as traction.
 */
export function serverSnapshot(db: KindleDb) {
  const plans = db.select().from(activities).all().filter((row) => row.demo === 0 && row.status !== "draft");
  const reachedThree = plans.filter((row) => {
    const created = Date.parse(row.createdAt);
    const going = db.select().from(rsvps).where(eq(rsvps.activityId, row.id)).all();
    const inDay = going.filter((item) => item.status === "going" && Date.parse(item.updatedAt) - created <= 24 * 60 * 60 * 1000);
    return inDay.length >= 3;
  }).length;
  const members = db.select().from(users).all().filter((row) => row.kind === "member");
  const repeatHosts = members.filter((member) => {
    const hosted = plans.some((row) => row.hostId === member.id);
    const attended = db
      .select()
      .from(rsvps)
      .where(eq(rsvps.userId, member.id))
      .all()
      .some((row) => row.status === "going");
    return hosted && attended;
  }).length;
  return {
    memberProfiles: members.length,
    publishedPlans: plans.length,
    plansWithThreeGoingWithin24h: reachedThree,
    membersWhoHostedAndJoined: repeatHosts,
  };
}
