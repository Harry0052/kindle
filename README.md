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

Stage 1 stores a profile and shows Tonight. Friend plans, RSVP, chat, and safety actions are not on screen yet. See `STATUS.md`.

The example poster on the signed-out page is not saved and does not invite anyone. Demo rows in the database, if present, are marked `kind` = `demo` and are not your profile.
