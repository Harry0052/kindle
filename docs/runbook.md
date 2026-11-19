# Kindle runbook

This build runs as one Node process with a SQLite file. It is a local product, not a hosted production service. There is no compliance certification and no on-call rotation.

## Run locally

```bash
npm install
npm run db:setup
npm run dev
```

`KINDLE_DB_PATH` selects the database file. The default is `data/kindle.db`. No API key is required. Copy `.env.example` to `.env.local` only if you want a different path.

## What starts

`npm run dev` and `npm start` open the database, apply any new SQL files in `drizzle/migrations`, and seed Demo Jordan and Demo Sam if they are missing. Demo rows are labeled and are not friends with real profiles.

## Migrations

Migrations are ordered SQL files. Each file runs once inside a transaction and is recorded in `schema_migrations`. There is no down migration. To undo a bad migration, stop the server and replace the database file with a copy from before the migration.

## Rollback

1. Stop the Node process.
2. Replace `data/kindle.db` (and the `-wal` and `-shm` files, if present) with the last good copy.
3. Start the process again.

Do not delete the SQLite file if it holds the only copy of people's plans.

## Environment

| Name | Required | Meaning |
| --- | --- | --- |
| `KINDLE_DB_PATH` | No | SQLite file. Default `data/kindle.db`. |
| `CI` | No | GitHub Actions sets this so Playwright starts the already built server. |

There is no secret, SMTP password, map key, or payment key in this build.

## If something fails

- Profile or plan saves return a visible error and do not claim success.
- A hidden plan renders the not-found screen and omits the title and exact spot.
- Failures in route handlers are logged as one JSON line with a short message. Tokens and exact spots are not intentionally logged.
- Kindle does not send email or SMS, so there is no delivery queue to drain.

## Checks before sharing a build

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

GitHub Actions runs the same commands on `main`.
