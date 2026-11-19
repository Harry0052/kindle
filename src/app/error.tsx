"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto grid w-full max-w-xl gap-4 px-4 py-16 md:px-8">
      <h1 className="font-display text-5xl text-ink">That screen did not load.</h1>
      <p className="text-ink-soft">Nothing new was saved. You can try the screen again.</p>
      <button type="button" onClick={() => reset()} className="inline-flex min-h-12 w-fit items-center rounded-full bg-ink px-5 font-semibold text-white">
        Try again
      </button>
    </main>
  );
}
