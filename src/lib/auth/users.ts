import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import { sessions, userInterests, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";
import { profileSchema } from "@/lib/validators/profile";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  displayName: string;
  timezone: string;
  ageAttested: boolean;
  homeRegion: string;
  interests: string[];
  kind: string;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry(from = new Date()) {
  return new Date(from.getTime() + THIRTY_DAYS_MS).toISOString();
}

function interestList(db: KindleDb, userId: string) {
  return db
    .select()
    .from(userInterests)
    .where(eq(userInterests.userId, userId))
    .all()
    .map((row) => row.interest);
}

export function toPublicUser(row: typeof users.$inferSelect, interests: string[]): PublicUser {
  return {
    id: row.id,
    displayName: row.displayName,
    timezone: row.timezone,
    ageAttested: row.ageAttested === 1,
    homeRegion: row.homeRegion,
    interests,
    kind: row.kind,
  };
}

function replaceInterests(db: KindleDb, userId: string, interests: string[]) {
  db.delete(userInterests).where(eq(userInterests.userId, userId)).run();
  for (const interest of interests) {
    db.insert(userInterests).values({ userId, interest }).run();
  }
}

export function createMemberRecord(db: KindleDb, input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const createdAt = nowIso();
  db.insert(users)
    .values({
      id,
      displayName: parsed.data.displayName,
      timezone: parsed.data.timezone,
      ageAttested: 1,
      homeRegion: parsed.data.homeRegion,
      kind: "member",
      createdAt,
    })
    .run();
  replaceInterests(db, id, parsed.data.interests);
  db.insert(sessions)
    .values({
      id: randomUUID(),
      userId: id,
      tokenHash: hashToken(token),
      createdAt,
      expiresAt: sessionExpiry(),
    })
    .run();
  recordEvent(db, id, "profile_created", { created: true });
  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) return { ok: false as const, message: "Kindle could not store that profile." };
  return { ok: true as const, user: toPublicUser(row, parsed.data.interests), token };
}

export function readUserByToken(db: KindleDb, token: string) {
  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, nowIso())))
    .get();
  if (!row || row.user.kind === "deleted") return null;
  return toPublicUser(row.user, interestList(db, row.user.id));
}

export function updateProfile(db: KindleDb, userId: string, input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const existing = db.select().from(users).where(eq(users.id, userId)).get();
  if (!existing || existing.kind !== "member") {
    return { ok: false as const, message: "That profile cannot be changed." };
  }
  db.transaction((tx) => {
    tx.update(users)
      .set({
        displayName: parsed.data.displayName,
        timezone: parsed.data.timezone,
        homeRegion: parsed.data.homeRegion,
        ageAttested: 1,
      })
      .where(eq(users.id, userId))
      .run();
    tx.delete(userInterests).where(eq(userInterests.userId, userId)).run();
    for (const interest of parsed.data.interests) {
      tx.insert(userInterests).values({ userId, interest }).run();
    }
  });
  recordEvent(db, userId, "profile_updated", { created: false });
  const row = db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) return { ok: false as const, message: "That session is no longer on this server." };
  return { ok: true as const, user: toPublicUser(row, parsed.data.interests) };
}

export function revokeSession(db: KindleDb, token: string) {
  db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))).run();
}
