import Link from "next/link";
import type { NavItem } from "./nav";
import { PrimaryNav } from "./primary-nav";

export function KindleMark() {
  return (
    <span className="kindle-mark" aria-hidden>
      <span />
    </span>
  );
}

export function SiteHeader({ displayName, items }: { displayName: string | null; items: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-full pr-2">
          <KindleMark />
          <span className="font-display text-2xl tracking-tight">Kindle</span>
        </Link>
        <PrimaryNav items={items} variant="desktop" />
        <div className="flex items-center gap-2">
          {displayName ? (
            <Link href="/account" className="inline-flex min-h-12 max-w-40 items-center truncate rounded-full bg-white/10 px-4 text-sm font-semibold">
              {displayName}
            </Link>
          ) : (
            <a href="#start" className="inline-flex min-h-12 items-center rounded-full bg-sunset px-4 text-sm font-bold text-ink">
              Start
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
