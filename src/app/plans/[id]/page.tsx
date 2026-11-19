import { notFound, redirect } from "next/navigation";
import { CommentForm, TimeForm } from "@/components/product/plan-updates";
import { BlockButton, CancelPlan, LeaveButton, ReportForm, ReuseForm } from "@/components/product/safety-actions";
import { PublishButton } from "@/components/product/publish-button";
import { RsvpControls } from "@/components/product/rsvp-controls";
import { Badge } from "@/components/ui/badge";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getPlan } from "@/lib/plans/service";
import { listMessages } from "@/lib/plans/updates";

export const metadata = { title: "Plan" };

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) redirect("/");
  const { id } = await params;
  const plan = getPlan(db, user, id);
  if (!plan) notFound();
  const messages = listMessages(db, user, id) ?? [];
  const canComment = plan.viewerStatus === "host" || plan.viewerStatus === "going";

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
          {plan.viewerIsHost && plan.status === "published" ? <TimeForm activityId={plan.id} /> : null}
          <section className="grid gap-3" aria-label="Updates">
            <h2 className="font-display text-3xl">Updates</h2>
            {messages.length === 0 ? <p className="text-sm text-ink-soft">No updates yet.</p> : null}
            <ul className="grid gap-2">
              {messages.map((message) => (
                <li key={message.id} className="rounded-2xl bg-paper px-4 py-3">
                  <p className="text-sm font-bold">{message.kind === "system" ? "Update" : message.authorName}</p>
                  <p>{message.body}</p>
                </li>
              ))}
            </ul>
            {canComment && plan.status === "published" ? <CommentForm activityId={plan.id} /> : null}
            <div className="grid gap-4 border-t border-line pt-4">
              {plan.viewerIsHost ? <CancelPlan activityId={plan.id} /> : null}
              {plan.viewerIsHost ? <ReuseForm activityId={plan.id} /> : null}
              {!plan.viewerIsHost && plan.status === "published" ? <LeaveButton activityId={plan.id} /> : null}
              {!plan.viewerIsHost ? <BlockButton userId={plan.hostId} label={plan.hostName} /> : null}
              <ReportForm subjectType="activity" subjectId={plan.id} />
            </div>
            {!canComment && plan.status === "published" ? (
              <p className="text-sm text-ink-soft">Comments stay with people who are in. The waitlist can see time updates only.</p>
            ) : null}
          </section>
        </div>
      </article>
    </main>
  );
}
