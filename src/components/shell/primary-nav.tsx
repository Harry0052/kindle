"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Plus, Users, type LucideIcon } from "lucide-react";
import type { NavIcon, NavItem } from "./nav";

const icons: Record<NavIcon, LucideIcon> = {
  tonight: House,
  plans: CalendarDays,
  create: Plus,
  friends: Users,
};

export function PrimaryNav({ items, variant }: { items: NavItem[]; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const activeFor = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  if (items.length < 2) return null;

  if (variant === "desktop") {
    return (
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {items.map((item) => {
          const active = activeFor(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-12 items-center rounded-full px-4 text-base font-semibold ${
                active ? "bg-sunset text-ink" : "text-lavender hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper md:hidden">
      <ul className={`grid ${items.length === 4 ? "grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {items.map((item) => {
          const Icon = icons[item.icon];
          const active = activeFor(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-xs font-semibold leading-tight ${
                  active ? "text-sunset-deep" : "text-ink-soft"
                }`}
              >
                <Icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
