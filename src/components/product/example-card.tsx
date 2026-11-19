import { Badge } from "@/components/ui/badge";

export function ExampleCard() {
  return (
    <article aria-label="Example plan, not a live plan" className="overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-xl">
      <div className="flex items-center justify-between gap-3 bg-sunset px-5 py-4 text-ink">
        <Badge tone="demo">Example</Badge>
        <p className="text-sm font-bold">Not a live plan</p>
      </div>
      <div className="space-y-4 px-5 py-6">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-sunset">Sport · tonight</p>
        <h2 className="font-display text-4xl leading-none">Basketball tonight</h2>
        <p className="text-3xl font-semibold">7:00 pm</p>
        <p className="text-lavender">Riverside courts area · 4 spots</p>
        <p className="max-w-prose text-sm leading-relaxed text-white/80">
          This poster shows the shape of a plan. It is not saved, nobody is invited, and the spot is made up.
        </p>
      </div>
    </article>
  );
}
