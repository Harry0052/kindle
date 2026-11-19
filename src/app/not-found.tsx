import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto grid w-full max-w-xl gap-4 px-4 py-16 md:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-sunset-deep">404</p>
      <h1 className="font-display text-5xl text-ink">Kindle can&apos;t find that page.</h1>
      <p className="text-ink-soft">The link may be old, or the plan is not yours to see.</p>
      <Link href="/" className={buttonClass("primary", "w-fit")}>
        Back to Tonight
      </Link>
    </main>
  );
}
