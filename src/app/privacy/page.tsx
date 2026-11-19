import { disabledReason, flags } from "@/lib/flags";

export const metadata = { title: "Privacy and limits" };

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header>
        <h1 className="font-display text-5xl text-ink">Privacy and limits</h1>
        <p className="mt-3 max-w-prose text-lg text-ink-soft">
          Kindle stores what you type so a plan can survive a refresh. It is a local-first app in this build. It is not a certified privacy product.
        </p>
      </header>
      <section className="grid gap-3 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">What this server stores</h2>
        <p>Your display name, timezone, and the fact that you confirmed you are 18 or older. A session cookie holds a random token. The database stores only a hash of that token.</p>
      </section>
      <section className="grid gap-3 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">What is not connected</h2>
        <ul className="grid gap-2">
          {Object.entries(flags).map(([key, enabled]) => (
            <li key={key} className="text-ink-soft">
              <span className="font-bold text-ink">{enabled ? "On" : "Off"}.</span> {disabledReason(key as keyof typeof flags)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
