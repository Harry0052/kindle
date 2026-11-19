import Link from "next/link";
import { disabledReason, flags } from "@/lib/flags";

export const metadata = { title: "Privacy and limits" };

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header>
        <h1 className="font-display text-5xl text-ink">Privacy and limits</h1>
        <p className="mt-3 max-w-prose text-lg text-ink-soft">
          Kindle is for adults planning with people they choose. This page describes what this server actually does. It is not a privacy certification.
        </p>
      </header>
      <section className="grid gap-3 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">Who can see a plan</h2>
        <p>A published plan is visible to you and to people who accepted a friend link with you. A draft is visible only to you. The area name is the public part. The exact spot is shown to you, and to a friend only after they are in.</p>
        <p>Blocking someone removes your plans from them immediately, including a plan they already joined. Their spot is freed. They cannot comment or accept a new link from you.</p>
      </section>
      <section className="grid gap-3 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">What is stored</h2>
        <p>Your display name, timezone, area, interests, and the statement that you are 18 or older. Plans, RSVPs, comments, blocks, and reports. A session cookie holds a random token. The database stores only a hash of that token.</p>
        <p>Kindle does not verify the age statement. It does not read contacts, use GPS, or show a map.</p>
      </section>
      <section className="grid gap-3 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">Reports</h2>
        <p>A report is saved on this server. Kindle does not have a moderation team or vendor connected, so filing a report does not contact anyone. Use block if you need the person gone from your plans now.</p>
      </section>
      <section className="grid gap-3 rounded-[1.75rem] bg-white p-5">
        <h2 className="font-display text-3xl">What is not connected</h2>
        <ul className="grid gap-2">
          {Object.entries(flags).map(([key, enabled]) => (
            <li key={key}>
              <span className="font-bold">{enabled ? "On" : "Off"}.</span> {disabledReason(key as keyof typeof flags)}
            </li>
          ))}
        </ul>
      </section>
      <p>
        <Link href="/account" className="font-semibold underline decoration-sunset decoration-2 underline-offset-4">
          Download or delete your profile
        </Link>
      </p>
    </main>
  );
}
