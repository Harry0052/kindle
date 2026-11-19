import { AcceptInvite } from "@/components/product/accept-invite";
import { StartForm } from "@/components/product/start-form";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { areFriends, previewInvite } from "@/lib/friends/service";

export const metadata = { title: "Friend link" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const preview = previewInvite(db, token);
  const user = await readSessionUser(db);

  return (
    <main id="main" className="mx-auto grid w-full max-w-xl gap-6 px-4 py-6 md:px-8 md:py-10">
      {!preview ? (
        <>
          <h1 className="font-display text-5xl text-ink">This friend link is not active.</h1>
          <p className="text-ink-soft">It may have expired, or it was never created on this server. Ask for a new link.</p>
        </>
      ) : (
        <>
          <header>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-sunset-deep">Friend request</p>
            <h1 className="mt-2 font-display text-5xl text-ink">{preview.inviterName} invited you.</h1>
            <p className="mt-3 text-ink-soft">
              Accepting lets you see plans they publish to friends. You will not see their exact meeting spots until you are in a plan. Kindle does not share your contacts.
            </p>
          </header>
          {preview.demo ? <p className="rounded-2xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">This is a demo profile and cannot be accepted.</p> : null}
          {!user ? <StartForm mode="create" nextPath={`/i/${token}`} /> : null}
          {user && !preview.demo ? (
            areFriends(db, user.id, preview.inviterId) ? (
              <p className="rounded-2xl bg-good-bg px-4 py-3 font-semibold text-good">You are already friends with {preview.inviterName}.</p>
            ) : (
              <AcceptInvite token={token} />
            )
          ) : null}
        </>
      )}
    </main>
  );
}
