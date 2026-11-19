import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-ink-soft md:px-8">
      <p>
        Kindle is a working name for planning with friends. It is not affiliated with any bookstore or e-reader.
      </p>
      <p className="mt-2">
        <Link href="/privacy" className="font-semibold text-ink underline decoration-sunset decoration-2 underline-offset-4">
          Privacy and limits
        </Link>
      </p>
    </footer>
  );
}
