import { redirect } from "next/navigation";
import { AccountTools } from "@/components/product/account-tools";
import { LogoutButton } from "@/components/product/logout-button";
import { StartForm } from "@/components/product/start-form";
import { personalCounts } from "@/lib/account/privacy";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) redirect("/");
  const counts = personalCounts(db, user.id);

  return (
    <main id="main" className="mx-auto grid w-full max-w-xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header>
        <h1 className="font-display text-5xl text-ink">Profile</h1>
        <p className="mt-2 text-ink-soft">This is the name friends will see on a plan you host.</p>
      </header>
      <StartForm
        mode="edit"
        initialName={user.displayName}
        initialTimezone={user.timezone}
        initialRegion={user.homeRegion}
        initialInterests={user.interests}
      />
      <AccountTools displayName={user.displayName} hosted={counts.hosted} going={counts.going} />
      <LogoutButton />
    </main>
  );
}
