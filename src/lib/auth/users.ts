import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  displayName: string;
  timezone: string;
  ageAttested: boolean;
  kind: string;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry(from = new Date()) {
  return new Date(from.getTime() + THIRTY_DAYS_MS).toISOString();
}

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    displayName: row.displayName,
    timezone: row.timezone,
    ageAttested: row.ageAttested === 1,
    kind: row.kind,
  };
}

export function createMemberRecord(db: KindleDb, input: ProfileInput) {
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
      kind: "member",
      createdAt,
    })
    .run();
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
  return { ok: true as const, user: toPublicUser(row), token };
}

export function readUserByToken(db: KindleDb, token: string) {
  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, nowIso())))
    .get();
  if (!row || row.user.kind === "deleted") return null;
  return toPublicUser(row.user);
}

export function updateProfile(db: KindleDb, userId: string, input: ProfileInput) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const existing = db.select().from(users).where(eq(users.id, userId)).get();
  if (!existing || existing.kind !== "member") {
    return { ok: false as const, message: "That profile cannot be changed." };
  }
  db.update(users)
    .set({
      displayName: parsed.data.displayName,
      timezone: parsed.data.timezone,
      ageAttested: 1,
    })
    .where(eq(users.id, userId))
    .run();
  recordEvent(db, userId, "profile_updated", { created: false });
  const row = db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) return { ok: false as const, message: "That session is no longer on this server." };
  return { ok: true as const, user: toPublicUser(row) };
}

export function revokeSession(db: KindleDb, token: string) {
  db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))).run();
}
