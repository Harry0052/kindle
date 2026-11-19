import Link from "next/link";
import { ActivityCard } from "@/components/product/activity-card";
import { EmptyState } from "@/components/ui/empty-state";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listHosted } from "@/lib/plans/service";
import { redirect } from "next/navigation";

export const metadata = { title: "Plans" };

export default async function PlansPage() {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) redirect("/");
  const plans = listHosted(db, user);

  return (
    <main id="main" className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl text-ink">My plans</h1>
          <p className="mt-2 max-w-xl text-ink-soft">Plans you host, including drafts. Friends cannot see a draft.</p>
        </div>
        <Link href="/create" className="inline-flex min-h-12 items-center rounded-full bg-ink px-5 font-semibold text-white">
          New plan
        </Link>
      </header>
      {plans.length === 0 ? (
        <EmptyState title="No plans yet" body="Create one with a time, an area, and how many people can come." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <ActivityCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </main>
  );
}
