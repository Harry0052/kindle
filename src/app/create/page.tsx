import { redirect } from "next/navigation";
import { CreateForm } from "@/components/product/create-form";
import { StartForm } from "@/components/product/start-form";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { profileReady } from "@/lib/validators/profile";

export const metadata = { title: "Create" };

export default async function CreatePage() {
  const user = await readSessionUser(getDb());
  if (!user) redirect("/");

  return (
    <main id="main" className="mx-auto grid w-full max-w-xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header>
        <h1 className="font-display text-5xl text-ink">Create a plan</h1>
        <p className="mt-2 text-ink-soft">Friends of yours can see a published plan. People who are not friends cannot open it.</p>
      </header>
      {profileReady(user) ? (
        <CreateForm defaultArea={user.homeRegion} />
      ) : (
        <div className="grid gap-4">
          <p className="rounded-2xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">
            Add your area and at least one interest before hosting.
          </p>
          <StartForm mode="edit" nextPath="/create" initialName={user.displayName} initialTimezone={user.timezone} initialRegion={user.homeRegion} initialInterests={user.interests} />
        </div>
      )}
    </main>
  );
}
