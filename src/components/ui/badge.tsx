import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-lavender text-ink",
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  sunset: "bg-sunset/20 text-sunset-deep",
  demo: "bg-ink text-white",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold uppercase tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}
