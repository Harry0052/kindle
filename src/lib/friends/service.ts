import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, or } from "drizzle-orm";
import { hashToken } from "@/lib/auth/users";
import { recordEvent } from "@/lib/audit";
import type { KindleDb } from "@/lib/db/client";
import { friendEdges, friendInvites, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function orderedPair(a: string, b: string) {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

export function findEdge(db: KindleDb, a: string, b: string) {
  const pair = orderedPair(a, b);
  return db
    .select()
    .from(friendEdges)
    .where(and(eq(friendEdges.userLow, pair.low), eq(friendEdges.userHigh, pair.high)))
    .get();
}

export function areFriends(db: KindleDb, a: string, b: string) {
  if (a === b) return false;
  return findEdge(db, a, b)?.status === "accepted";
}

export function createFriendInvite(db: KindleDb, inviterId: string) {
  const token = randomBytes(32).toString("base64url");
  const createdAt = nowIso();
  db.insert(friendInvites)
    .values({
      id: randomUUID(),
      inviterId,
      tokenHash: hashToken(token),
      createdAt,
      expiresAt: new Date(Date.now() + FOURTEEN_DAYS_MS).toISOString(),
    })
    .run();
  recordEvent(db, inviterId, "friend_invite_created", {});
  return { token, path: `/i/${token}` };
}

export function previewInvite(db: KindleDb, token: string) {
  const invite = db
    .select({ invite: friendInvites, inviter: users })
    .from(friendInvites)
    .innerJoin(users, eq(users.id, friendInvites.inviterId))
    .where(and(eq(friendInvites.tokenHash, hashToken(token)), gt(friendInvites.expiresAt, nowIso())))
    .get();
  if (!invite || invite.inviter.kind === "deleted") return null;
  return {
    inviterId: invite.inviter.id,
    inviterName: invite.inviter.displayName,
    demo: invite.inviter.kind === "demo",
  };
}

export function acceptInvite(db: KindleDb, userId: string, token: string) {
  const preview = previewInvite(db, token);
  if (!preview) return { ok: false as const, message: "That friend link is expired or unknown." };
  if (preview.inviterId === userId) return { ok: false as const, message: "That is your own friend link." };
  if (preview.demo) return { ok: false as const, message: "Demo profiles cannot be added as friends." };
  const existing = findEdge(db, userId, preview.inviterId);
  const now = nowIso();
  if (existing?.status === "accepted") {
    return { ok: true as const, friendName: preview.inviterName, already: true };
  }
  const pair = orderedPair(userId, preview.inviterId);
  if (existing) {
    db.update(friendEdges)
      .set({ status: "accepted", requesterId: preview.inviterId, updatedAt: now })
      .where(eq(friendEdges.id, existing.id))
      .run();
  } else {
    db.insert(friendEdges)
      .values({
        id: randomUUID(),
        userLow: pair.low,
        userHigh: pair.high,
        requesterId: preview.inviterId,
        status: "accepted",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
  recordEvent(db, userId, "friend_accepted", {});
  return { ok: true as const, friendName: preview.inviterName, already: false };
}

export type FriendRow = { id: string; displayName: string };

export function listFriends(db: KindleDb, userId: string): FriendRow[] {
  const edges = db
    .select()
    .from(friendEdges)
    .where(
      and(
        eq(friendEdges.status, "accepted"),
        or(eq(friendEdges.userLow, userId), eq(friendEdges.userHigh, userId)),
      ),
    )
    .all();
  const ids = edges.map((edge) => (edge.userLow === userId ? edge.userHigh : edge.userLow));
  if (ids.length === 0) return [];
  const people = db.select().from(users).all();
  return people
    .filter((person) => ids.includes(person.id) && person.kind !== "deleted")
    .map((person) => ({ id: person.id, displayName: person.displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
