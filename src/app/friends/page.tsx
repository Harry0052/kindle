import { redirect } from "next/navigation";
import { InvitePanel } from "@/components/product/invite-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listFriends } from "@/lib/friends/service";

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) redirect("/");
  const friends = listFriends(db, user.id);

  return (
    <main id="main" className="mx-auto grid w-full max-w-xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header>
        <h1 className="font-display text-5xl text-ink">Friends</h1>
        <p className="mt-2 text-ink-soft">Only people who open your link and accept can see plans you publish.</p>
      </header>
      <InvitePanel />
      {friends.length === 0 ? (
        <EmptyState title="No friends yet" body="Create a link and send it yourself. Kindle will not message anyone." />
      ) : (
        <ul className="grid gap-2">
          {friends.map((friend) => (
            <li key={friend.id} className="flex min-h-14 items-center rounded-2xl bg-white px-4 font-semibold">
              {friend.displayName}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
