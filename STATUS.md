# Kindle status

Working name: **Kindle**. This is not the Amazon product and does not use that branding. The build brief called the product GATHER. The owner renamed it Kindle.

Current stage: **6 — local release candidate. Not a production or compliance claim.**

## Stage 6 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 6
STATUS: PASS
USER-FACING WORKING FLOWS: The full local loop works: profile, friend link, private plan, RSVP with capacity and waitlist, exact spot after I'm in, comments, time change, cancel, reuse as a draft, block, report, leave, JSON download, and delete. Delete cancels hosted plans and clears exact spots.
UI/UX: Screenshots in docs/screenshots for landing at 390 and 1440, Tonight at 390, a published plan at 1440, and Friends at 390. Mobile nav is a solid bar. Playwright also checks that 390 and 1440 landing widths do not overflow.
DATA + SECURITY: Export and delete are same-origin and rate-limited. Delete removes the session, friend edges, blocks, and interests, and rewrites the name to Deleted member. serverSnapshot counts real rows and is not shown as public traction. A hidden plan still can be HTTP 200 while the body is the not-found screen and omits the plan. No CSP hash list. SQLite is one file.
TESTS: npm test -> 23 passed. npm run lint -> pass. npm run typecheck -> pass. npm run build -> pass. CI=true npx playwright test --retries=0 -> 6 passed after the final screenshot assertion fix.
REAL INTEGRATIONS: local SQLite and in-app invite links | SANDBOX: none | DISABLED: contacts, GPS, maps, venues, email, SMS, push, identity verification, payments, moderation delivery
FILES CHANGED: account export/delete, metrics, runbook, pilot plan, README, screenshots.
OPEN BUGS/RISKS: Hidden-plan HTTP status can be 200. No pilot has been run, so the ship decision is not ready to call. Single-server SQLite. Reports are stored and not reviewed.
NEXT STAGE PROPOSAL: None in this build. A real 10–30 person pilot is the next product decision, not more UI.
AWAITING APPROVAL: NO — the owner asked for the build to be finished on main.
```

## Stage 5 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 5
STATUS: PASS
USER-FACING WORKING FLOWS: Block removes a person's view of your plans immediately, frees a spot they held, and stops a new friend link. Leave, cancel, and "plan this again" work. Cancel marks RSVPs cancelled and hides the exact spot from guests. A copied plan is a draft with no guest list. Reports are saved with an on-screen statement that nobody is notified. The privacy page explains these limits.
UI/UX: Block and cancel ask for a confirm step. Friends and plan pages show the controls. Privacy is linked from the footer.
DATA + SECURITY: blocks and reports tables. Visibility checks blocks before friendship. Cancellation is transactional with the RSVP update. Reports do not call an outside service.
TESTS: src/lib/plans/safety.test.ts passed inside npm test (23 passed overall).
REAL INTEGRATIONS: local SQLite | SANDBOX: none | DISABLED: moderation delivery, email, SMS, push, maps, contacts
FILES CHANGED: safety service, block/report/leave/cancel/duplicate routes, privacy page.
OPEN BUGS/RISKS: A report does not start a review. Blocking is immediate only on this server.
NEXT STAGE PROPOSAL: Export, delete, deployment notes, and an honest pilot plan.
AWAITING APPROVAL: NO
```

## Stage 4 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 4
STATUS: PASS
USER-FACING WORKING FLOWS: The host can change the time. People who are in or waiting get an in-app notice. Kindle does not text or email them. Comments are limited to the host and people who are in. A past start time leaves Tonight and stays on My Plans. The same UTC instant renders differently in Chicago and New York.
UI/UX: Plan page has the time field, updates list, and comment box. Playwright posts a comment and sees it after refresh.
DATA + SECURITY: activity_messages and notifications. Waitlist can read system updates and not comments. Time is stored in UTC.
TESTS: src/lib/plans/updates.test.ts passed inside npm test. Playwright plans spec includes the comment refresh.
REAL INTEGRATIONS: in-app notices | SANDBOX: none | DISABLED: email, SMS, push
FILES CHANGED: updates service, time and message routes, plan and Plans pages, migration 0004.
OPEN BUGS/RISKS: Notices are not pushed anywhere. A spot opening does not auto-promote the waitlist.
NEXT STAGE PROPOSAL: Block, report, leave, cancel, and reuse.
AWAITING APPROVAL: NO
```


## Stage 3 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 3
STATUS: PASS
USER-FACING WORKING FLOWS: A friend can tap I'm in or Can't go. The host already uses one spot. When the plan is full, another I'm in becomes a waitlist and the screen says a spot is not held. The exact spot appears only for the host and people who are in. Refresh keeps the RSVP. A second tap of I'm in does not take another spot.
UI/UX: The plan page shows spots as "N of M in", a roster of people who are in, and the hidden-spot state before RSVP. Playwright completes signup, publish, a stranger denial, a friend accept, and the reveal after I'm in.
DATA + SECURITY: rsvps table and activities.going_count. The last spot is claimed with UPDATE ... WHERE going_count < capacity inside an immediate transaction. Two overlapping writers were tested with worker threads; only one increment succeeded. Waitlist does not reveal the exact spot.
TESTS: npm test -> 17 passed, including the capacity and concurrency tests. npm run lint -> pass. npm run typecheck -> pass. npm run build -> pass. CI=true npx playwright test --retries=0 -> 5 passed.
REAL INTEGRATIONS: local SQLite | SANDBOX: none | DISABLED: contacts, GPS, maps, venues, email, SMS, push, identity verification, payments
FILES CHANGED: RSVP service, capacity SQL, plan controls, migration 0003.
OPEN BUGS/RISKS: A hidden plan's document can still be HTTP 200 while the body is the not-found screen and omits the plan. Waitlist is not auto-promoted when a spot opens. No email is sent when someone joins.
NEXT STAGE PROPOSAL: In-plan comments for people who are in, a host time change that writes an in-app notice, and Tonight dropping plans whose start time has passed.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```


## Stage 2 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 2
STATUS: PASS
USER-FACING WORKING FLOWS: Onboarding now stores a home area and interests. A person can publish or draft a plan with a local time, a public area, and a private exact spot. Friends are added only by an invite link the other person accepts. A stranger gets the not-found screen and the response does not include the title, area, or exact spot. A friend sees the area and the time in their timezone, and the exact spot stays hidden. Demo Jordan and Demo Sam stay labeled demo and are not shown to a real profile.
UI/UX: Playwright covered the landing at 390px and 1440px, and the create-to-plan flow in Chromium. Interest choices are visible checkboxes with large targets. No map, contact import, or send button is offered.
DATA + SECURITY: Added home_region, user_interests, friend_invites (token hash only), friend_edges, and activities. Drafts are host-only. Published plans require an accepted friend edge. Exact location is omitted unless the viewer is the host. Street-like public areas are rejected. Writes are same-origin and rate-limited.
TESTS: npm test -> 15 passed. npm run lint -> pass. npm run typecheck -> pass. npm run build -> pass. CI=true npx playwright test --retries=0 -> foundation 4 passed, plans privacy flow passed.
REAL INTEGRATIONS: local SQLite, in-app invite links | SANDBOX: none | DISABLED: contacts, GPS, maps, venues, email, SMS, push, identity verification, payments
FILES CHANGED: friend and activity services, Tonight, Create, Plans, Friends, invite page, migration 0002.
OPEN BUGS/RISKS: The not-found document for a hidden plan can arrive with HTTP 200 while the rendered result is the not-found screen and the body omits the plan. RSVP does not exist yet, so a friend cannot become "in". No CSP hashes. SQLite is single-server.
NEXT STAGE PROPOSAL: RSVP going, decline, and waitlist, with capacity enforced by a conditional update and the exact spot shown only to people who are in.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```


## Stage 1 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 1
STATUS: PASS
USER-FACING WORKING FLOWS: A visitor can save a display name, IANA timezone, and an 18+ attestation. Refresh keeps the profile. Log out clears the session. A too-short name stays on the form with an error and does not create a profile. Tonight shows an empty state and says Kindle does not invent nearby people. The example poster is labeled and has no join action.
UI/UX: Landing and Tonight inspected by Playwright at 390px and 1440px. Neither width overflowed horizontally. Skip link, visible focus ring, labeled fields, and field errors are in the shell. Contrast uses ink on sunset and white on #B33B2A for the main action, because white on #FF725E is below WCAG AA.
DATA + SECURITY: SQLite tables users, sessions, security_events, rate_buckets. Session cookie is httpOnly and stores a random token; the database stores the SHA-256 hash. Profile writes require a same-origin request and a rate limit. Demo Jordan is seeded as kind=demo and is not a session. Age attestation is stored as a statement, not a verification.
TESTS: npm test -> 12 passed. npm run lint -> pass. npm run typecheck -> pass. npm run build -> pass. CI=true npm run test:e2e -> 4 passed after fixing a strict-mode locator (the first run failed the assertion, not the save).
REAL INTEGRATIONS: local SQLite | SANDBOX: none | DISABLED: contacts, GPS, maps, venues, email, SMS, push, identity verification, payments
FILES CHANGED: Next.js app, design tokens, profile session, CI workflow, foundation Playwright spec.
OPEN BUGS/RISKS: Plans, friends, and RSVP are not available yet, so the signed-in nav only shows Tonight. No CSP hashes. SQLite is single-server.
NEXT STAGE PROPOSAL: Interests, home area, friend invite links, and friends-only draft or published activities that a stranger cannot open.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```


The repository began as an empty private GitHub repo with a one-line README. There was no application code, database, or CI. Sibling apps `ripple`, `bond`, and `rewind` use the same local stack. Kindle follows that stack.

## Confirmed assumptions

- Local SQLite via `better-sqlite3` and Drizzle, with SQL migrations in `drizzle/migrations` and DEMO seed data. No hosted database is configured.
- Session is an httpOnly cookie holding a random token. The database stores only the SHA-256 hash. Sign-in is a display name plus an 18+ attestation, not a password provider. No email delivery is configured, so passwordless email is not available.
- Friends are created only when someone opens an invite link and accepts. There is no people search and no contact import.
- Activity visibility defaults to friends of the host. Exact meeting text stays hidden until a person has a `going` RSVP. The host can always see it.
- Time is stored in UTC and shown in the viewer's IANA timezone.
- A full plan does not accept another `going` RSVP. The extra person is waitlisted, and the screen says a waitlist does not hold a spot.
- In-app notices are real rows in SQLite. Kindle does not send email, SMS, or push.
- Reports are stored on this server only. There is no moderation vendor and no promise that a person will review them.
- The owner pre-approved stages 0–6 for this build, so work continues through Stage 6 without waiting between stages. Each stage still gets a report in this file and its own commit on `main`.

## Product scope for the first complete build

A person can state their name, timezone, home area, and interests, then publish "basketball tonight at 7" to friends. Friends accept a link, RSVP, and see the exact spot only after they are in. The host can change the time, cancel, or reuse the plan. People can leave, block, and report. Past plans leave Tonight.

## Integrations

| Capability | State |
| --- | --- |
| SQLite on this machine | Real |
| Invite links | Real, in-app |
| In-app plan notices | Real |
| Contact import | Disabled. Kindle does not read contacts. |
| Live location and public map | Disabled. No GPS and no map tiles. |
| Venue search or paid venue partnerships | Disabled. No venue account is connected. |
| Email, SMS, and push | Disabled. Nothing is sent off this server. |
| Identity or age verification | Disabled. The 18+ control is an attestation, not a check. |
| Payments | Disabled. |

## Technical risks

1. **SQLite write lock.** Capacity checks use a conditional `UPDATE` inside a transaction so two RSVPs cannot both take the last spot. This is correct for one Node process and for separate connections. It is not a multi-server lock. A second app server would need a shared database with the same transaction.
2. **Invite token display.** Only the hash is stored. The raw link is shown when it is created. Kindle cannot reconstruct it later.
3. **Timezone data.** Conversion uses `Intl` in Node 22. An unknown timezone is rejected. The display depends on the timezone the person chose, not on the device clock.
4. **No CSP hash pipeline.** Security headers match the sibling apps. A strict Content-Security-Policy is not claimed, because Next.js script hashes are not pinned in this repo.
5. **Age and safety.** There is no identity provider. The product refuses to continue without an 18+ attestation and does not offer stranger discovery. That is not a youth-safety certification.

## Primary mobile flow

1. **Landing.** The person sees what Kindle does, an example poster marked as an example, and the form to start.
2. **Profile.** Name, timezone, home area, interests, and 18+ attestation save on the server.
3. **Tonight.** Empty until a friend has a published plan, with a clear action to create one.
4. **Create.** Title, sport/food/hobby, local time, spots, area, and an optional exact spot.
5. **Plan.** The host copies a friend invite from Friends. After acceptance, the friend sees the poster without the exact spot, taps I'm in, and then sees the spot.
6. **Failure paths.** A stranger opening the plan URL is told Kindle cannot show it. A full plan offers a waitlist and says it does not hold a spot. A blocked person loses the plan immediately. Cancelling tells everyone who had an RSVP and hides the spot.

## Component map

- Shell: header, mobile nav, footer, skip link, toast, error and 404.
- UI: button, field, badge, empty state, skeleton.
- Product: example poster, start form, activity poster, create form, RSVP controls, comments, friend invite, safety actions, account export and delete.

## Stage 2 domain model (built in that stage, not before)

`users` (extended with home area), `user_interests`, `friend_invites`, `friend_edges`, `activities` with friends-only visibility and a private exact-location column. Later stages add `rsvps`, `activity_messages`, `notifications`, `blocks`, and `reports`.

## Security boundary

- Every read and write checks the session user.
- Mutations require a same-origin request and a rate limit.
- Drafts are host-only. Friends see published plans. Exact location is host-only until `going`.
- Blocks win over friendship.
- Demo rows are labeled and are not friends with real profiles.
- Secrets are not required for local use and are not committed.

## Stage 1 checklist

- App scripts for dev, lint, typecheck, Vitest, Playwright, production build, and `db:setup`.
- Design tokens from the brief: ink `#172033`, sunset `#FF725E`, lavender `#E7DDFC`, with a darker sunset for white button text so contrast passes WCAG 2.2 AA.
- Landing and a real saved profile, mobile nav, focus rings, 404 and error boundaries.
- No control that pretends to invite, map, or message.

## Stage 0 report

```text
PRODUCT: Kindle (brief name GATHER)
STAGE: 0
STATUS: PASS
USER-FACING WORKING FLOWS: None yet. The repo had only a placeholder README. No screen is available.
UI/UX: Not inspected. No UI exists.
DATA + SECURITY: No database. Session, friend, and activity rules are decided above and are not implemented.
TESTS: not run — there is no project to run yet.
REAL INTEGRATIONS: none | SANDBOX: none | DISABLED: contacts, GPS, maps, venues, email, SMS, push, identity verification, payments
FILES CHANGED: STATUS.md
OPEN BUGS/RISKS: The five risks in this file. No product bug exists yet because there is no product.
NEXT STAGE PROPOSAL: Scaffold the Next.js app, tokens, shell, profile session, and one real landing-to-Tonight path.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```
