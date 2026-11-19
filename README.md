# Kindle

Kindle turns “we should hang out” into a plan friends can accept. You name the activity, the time, and the area. Friends say they are in. The exact spot stays hidden until they do.

Kindle is a working name. This project is not affiliated with any bookstore, e-reader, or Amazon product, and it does not use that branding.

It runs on your machine with SQLite. It does not need an API key.

## Quickstart

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Save a name, timezone, area, and at least one interest, and confirm you are 18 or older. That profile is stored in `data/kindle.db`. Refresh the page and it is still there.

Then create a plan, open Friends, and copy a friend link. Another browser profile can accept it and tap **I'm in**.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

GitHub Actions runs those commands on `main`.

## Architecture

Next.js App Router, React, and TypeScript in strict mode. Tailwind CSS 4 holds the tokens: ink `#172033`, sunset `#FF725E`, and lavender `#E7DDFC`. White text sits on `#B33B2A` when sunset itself would fail contrast.

SQLite is opened with `better-sqlite3`. Drizzle is the query layer. SQL files in `drizzle/migrations` are the migrations, applied on startup. Domain rules live in `src/lib`, not in the page components. Pages read the database on the server. Forms post to route handlers that check the session, the origin, and a rate limit.

Sessions are an httpOnly cookie. The database stores the SHA-256 hash of a random token. There is no password and no email login, because no mail provider is configured.

Time is stored in UTC and shown with `Intl` in the timezone on the profile.

```text
src/app            pages and route handlers
src/components     shell, controls, and plan UI
src/lib/plans      visibility, RSVP, comments, safety
src/lib/friends    invite links and blocks
src/lib/db         schema, migrations, demo seed
```

## What is real, sandboxed, or disabled

| Capability | State |
| --- | --- |
| Profiles, plans, RSVP, comments, blocks, reports | Real, stored in SQLite |
| Friend invite links | Real. You send the link yourself. Only a hash is stored. |
| In-app notices when a time changes, someone comments, or a plan is cancelled | Real rows in SQLite |
| Demo Jordan and Demo Sam | Seed data, labeled demo, not friends with you |
| Example poster on the signed-out page | A picture of the product. Not saved. |
| Contact import | Disabled. Kindle does not read contacts. |
| GPS and maps | Disabled. There is no live location and no map. |
| Venue search or paid partnerships | Disabled. No venue account is connected. |
| Email, SMS, and push | Disabled. Nothing is sent off this server. |
| Identity or age verification | Disabled. The 18+ control is an attestation, not a check. |
| Payments | Disabled. |
| Moderation vendor | Disabled. A report is saved here and nobody is notified. |

There is no sandbox that pretends one of those services answered.

## Privacy and safety

- Plans default to friends of the host.
- A stranger opening a plan URL gets the not-found screen. The response body does not include the title or the exact spot.
- The exact spot is shown to the host, and to a friend only after they are in. A waitlist does not reveal it and does not hold a spot.
- A full plan cannot take another "I'm in". The last spot is a conditional SQL update. Two overlapping writes were tested.
- Blocking removes that person's view of your plans immediately and frees a spot they held.
- Cancelling a plan marks RSVPs cancelled and hides the exact spot from guests.
- Download and delete are on the profile page. Delete cancels plans you host and clears exact spots.
- This is not a youth product. There is no stranger discovery.

Details are on the in-app Privacy page, in `docs/runbook.md`, and in `docs/pilot.md`.

## Not a production claim

Lint, typecheck, unit tests, Playwright, and the production build are part of CI. That does not make this a certified or production-ready service. SQLite here is one file on one machine. There is no strict Content-Security-Policy pinned to script hashes, no identity proof, and no pilot results. The pilot decision is "not ready to call" until someone runs the plan in `docs/pilot.md`.
