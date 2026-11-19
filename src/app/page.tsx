import { ExampleCard } from "@/components/product/example-card";
import { LogoutButton } from "@/components/product/logout-button";
import { StartForm } from "@/components/product/start-form";
import { EmptyState } from "@/components/ui/empty-state";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { disabledReason } from "@/lib/flags";
import { todayLabel } from "@/lib/time";

export default async function HomePage() {
  const user = await readSessionUser(getDb());
  if (!user) return <Landing />;
  return <Tonight name={user.displayName} timezone={user.timezone} />;
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

function Tonight({ name, timezone }: { name: string; timezone: string }) {
  return (
    <main id="main" className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="grid gap-2">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-sunset-deep">{todayLabel(timezone)}</p>
        <h1 className="font-display text-5xl text-ink">Tonight</h1>
        <p className="max-w-xl text-lg text-ink-soft">
          Saved on this server as <span className="font-bold text-ink">{name}</span>. Times use {timezone}.
        </p>
      </header>
      <EmptyState
        title="Nothing from friends yet"
        body="When a friend publishes a plan, it shows up here. Kindle does not invent nearby people, and your profile is not a public listing."
      />
      <section className="grid gap-4 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">Your profile</h2>
        <p className="text-sm text-ink-soft">Change your name or timezone. This stays on this server.</p>
        <StartForm mode="edit" initialName={name} initialTimezone={timezone} />
        <LogoutButton />
      </section>
    </main>
  );
}
