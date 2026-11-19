import Link from "next/link";
import { ActivityCard } from "@/components/product/activity-card";
import { ExampleCard } from "@/components/product/example-card";
import { StartForm } from "@/components/product/start-form";
import { EmptyState } from "@/components/ui/empty-state";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { disabledReason } from "@/lib/flags";
import { listTonight } from "@/lib/plans/service";
import { todayLabel } from "@/lib/time";
import { profileReady } from "@/lib/validators/profile";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await readSessionUser(getDb());
  if (!user) return <Landing />;
  const params = await searchParams;
  const category = params.category === "sport" || params.category === "food" || params.category === "hobby" ? params.category : undefined;
  const plans = listTonight(getDb(), user, { category });
  return <Tonight name={user.displayName} timezone={user.timezone} ready={profileReady(user)} category={category} plans={plans} />;
}

function Landing() {
  return (
    <main id="main" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sunset-deep">Plans with friends</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] text-ink md:text-7xl">
            From “we should hang out” to a real plan.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
            Name the activity, the time, and the area. Friends say yes. The exact spot stays hidden until they are in.
          </p>
        </div>
        <ul className="grid gap-2 text-sm font-semibold text-ink-soft">
          <li>{disabledReason("contactsImport")}</li>
          <li>{disabledReason("publicMap")}</li>
          <li>{disabledReason("emailDelivery")} You share a link yourself.</li>
        </ul>
        <StartForm mode="create" />
      </section>
      <ExampleCard />
    </main>
  );
}

function Tonight({
  name,
  timezone,
  ready,
  category,
  plans,
}: {
  name: string;
  timezone: string;
  ready: boolean;
  category?: string;
  plans: ReturnType<typeof listTonight>;
}) {
  const filters = [
    { href: "/", label: "All", value: undefined },
    { href: "/?category=sport", label: "Sport", value: "sport" },
    { href: "/?category=food", label: "Food", value: "food" },
    { href: "/?category=hobby", label: "Hobby", value: "hobby" },
  ];
  return (
    <main id="main" className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sunset-deep">{todayLabel(timezone)}</p>
          <h1 className="font-display text-5xl text-ink">Tonight</h1>
          <p className="max-w-xl text-lg text-ink-soft">
            Signed in as <span className="font-bold text-ink">{name}</span>. Times use {timezone}.
          </p>
        </div>
        <Link href="/create" className="inline-flex min-h-12 items-center rounded-full bg-sunset-deep px-5 font-semibold text-white">
          Create a plan
        </Link>
      </header>
      <div className="flex flex-wrap gap-2" aria-label="Filter plans">
        {filters.map((filter) => {
          const active = filter.value === category;
          return (
            <Link
              key={filter.label}
              href={filter.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-12 items-center rounded-full px-4 font-semibold ${active ? "bg-ink text-white" : "bg-white text-ink"}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>
      {!ready ? (
        <EmptyState title="Finish your profile" body="Add your area and an interest from Profile before a plan can go out to friends." />
      ) : null}
      {plans.length === 0 ? (
        <EmptyState
          title="Nothing from friends yet"
          body="Published plans from friends show up here. Kindle does not invent nearby people. Drafts stay on Plans until you publish them."
        />
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
