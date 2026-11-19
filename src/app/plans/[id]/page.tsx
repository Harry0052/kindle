import { notFound, redirect } from "next/navigation";
import { PublishButton } from "@/components/product/publish-button";
import { RsvpControls } from "@/components/product/rsvp-controls";
import { Badge } from "@/components/ui/badge";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getPlan } from "@/lib/plans/service";

export const metadata = { title: "Plan" };

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) redirect("/");
  const { id } = await params;
  const plan = getPlan(db, user, id);
  if (!plan) notFound();

  return (
    <main id="main" className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <article className="overflow-hidden rounded-[1.75rem] bg-white">
        <div className="flex items-center justify-between bg-ink px-5 py-4 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sunset">{plan.category}</p>
          <Badge tone={plan.status === "draft" ? "warn" : "neutral"}>{plan.status}</Badge>
        </div>
        <div className="grid gap-4 px-5 py-6">
          <h1 className="font-display text-5xl leading-none">{plan.title}</h1>
          <p className="text-2xl font-semibold">{plan.timeLabel}</p>
          <p className="text-ink-soft">
            {plan.areaLabel} · {plan.goingCount} of {plan.capacity} in · {plan.viewerIsHost ? "You are hosting" : `Hosted by ${plan.hostName}`}
          </p>
          {plan.status === "published" ? (
            <RsvpControls activityId={plan.id} viewerStatus={plan.viewerStatus} full={plan.goingCount >= plan.capacity} />
          ) : null}
          {plan.roster.length > 0 ? (
            <p className="text-sm text-ink-soft">In: {plan.roster.join(", ")}</p>
          ) : null}
          <section className="rounded-2xl bg-lavender/50 p-4" aria-label="Exact spot">
            <h2 className="text-sm font-bold uppercase tracking-wide">Exact spot</h2>
            {plan.exactHidden ? (
              <p className="mt-2 text-ink">Hidden until you are in.</p>
            ) : (
              <p className="mt-2 text-lg font-semibold">{plan.exactLocation ?? "No exact spot was added."}</p>
            )}
          </section>
          {plan.viewerIsHost && plan.status === "draft" ? <PublishButton activityId={plan.id} /> : null}
        </div>
      </article>
    </main>
  );
}
