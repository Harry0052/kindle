# Kindle

Kindle turns “we should hang out” into a plan friends can actually accept. The name is a working title. This project is not affiliated with any bookstore, e-reader, or Amazon product, and it does not use that branding.

This build runs on your machine with SQLite. It does not need an API key.

## Quickstart

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter a name, choose a timezone, and confirm you are 18 or older. Kindle stores that profile in `data/kindle.db`. Refresh the page and the name is still there. Log out from the profile page.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## What is real right now

You can save a profile, create a friends-only plan, add a friend with a link they accept, and RSVP. A full plan waitlists the next person and says a spot is not held. The exact spot is shown to the host and to people who are in. Plan comments, time-change notices, and block or report are not available yet. See `STATUS.md`.

The example poster on the signed-out page is not saved and does not invite anyone. Demo rows are marked `kind` = `demo` and are not your friends.
