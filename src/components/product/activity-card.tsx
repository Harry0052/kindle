import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PlanView } from "@/lib/plans/service";

const bands: Record<PlanView["category"], string> = {
  sport: "bg-sunset text-ink",
  food: "bg-lavender text-ink",
  hobby: "bg-good-bg text-good",
};

export function ActivityCard({ plan }: { plan: PlanView }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
      <div className={`flex items-center justify-between gap-3 px-5 py-4 ${bands[plan.category]}`}>
        <p className="text-sm font-bold uppercase tracking-[0.14em]">{plan.category}</p>
        <Badge tone={plan.status === "draft" ? "warn" : "neutral"}>{plan.status === "draft" ? "Draft" : plan.clockLabel}</Badge>
      </div>
      <div className="grid gap-3 px-5 py-5">
        <h2 className="font-display text-3xl leading-none text-ink">{plan.title}</h2>
        <p className="text-lg font-semibold text-ink">{plan.timeLabel}</p>
        <p className="text-ink-soft">
          {plan.areaLabel} · {plan.goingCount} of {plan.capacity} in
        </p>
        <p className="text-sm text-ink-soft">{plan.viewerIsHost ? "You are hosting" : `Hosted by ${plan.hostName}`}</p>
        {plan.exactHidden ? (
          <p className="text-sm font-semibold text-lavender-deep">Exact spot hidden</p>
        ) : (
          <p className="text-sm font-semibold text-ink">Exact spot: {plan.exactLocation ?? "Not set"}</p>
        )}
        <Link href={`/plans/${plan.id}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 font-semibold text-white">
          Open plan
        </Link>
      </div>
    </article>
  );
}
