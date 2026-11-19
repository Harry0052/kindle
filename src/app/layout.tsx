import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { navFor } from "@/components/shell/nav";
import { PrimaryNav } from "@/components/shell/primary-nav";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Kindle",
    template: "%s · Kindle",
  },
  description:
    "Make a real plan with friends. Kindle keeps the exact spot private until someone is in. It does not read contacts or show a live map.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await readSessionUser(getDb());
  const items = navFor(Boolean(user));

  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col pb-24 font-sans text-ink antialiased md:pb-8">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader displayName={user?.displayName ?? null} items={items} />
        <ToastProvider>
          <div className="flex-1">{children}</div>
        </ToastProvider>
        <SiteFooter />
        <PrimaryNav items={items} variant="mobile" />
      </body>
    </html>
  );
}
