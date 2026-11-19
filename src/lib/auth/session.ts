import { cookies } from "next/headers";
import { createMemberRecord, readUserByToken, revokeSession, updateProfile, type PublicUser } from "@/lib/auth/users";
import type { KindleDb } from "@/lib/db/client";
import type { ProfileInput } from "@/lib/validators/profile";

export const SESSION_COOKIE = "kindle_session";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function readSessionUser(db: KindleDb): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readUserByToken(db, token);
}

export async function writeSessionCookie(token: string, secure: boolean) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
    secure,
  });
}

export async function clearSessionCookie(db: KindleDb) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) revokeSession(db, token);
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function saveProfile(db: KindleDb, input: ProfileInput, secure: boolean) {
  const existing = await readSessionUser(db);
  if (!existing) {
    const created = createMemberRecord(db, input);
    if (!created.ok) return created;
    await writeSessionCookie(created.token, secure);
    return { ok: true as const, user: created.user };
  }
  if (existing.kind === "demo") {
    return { ok: false as const, message: "The demo profile cannot be edited." };
  }
  return updateProfile(db, existing.id, input);
}
