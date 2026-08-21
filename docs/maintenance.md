# Maintenance guide

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and AUTH_SECRET
npm run db:migrate
npm run db:seed              # creates the business + first owner login, once
npm run dev                  # http://localhost:3000
```

## Connect the development database

Create a Neon project (or branch) dedicated to development — see
[environment.md](./environment.md). Put its connection string in
`DATABASE_URL` inside `.env.local`. Never point local dev at production.

## Create a migration

1. Edit `src/lib/db/schema.ts`.
2. `npm run db:generate` — writes a new file into
   `src/lib/db/migrations/`. **Read the generated SQL** before applying it;
   drizzle-kit sometimes needs manual correction for edge cases (this
   project hit one: it emits `SET DATA TYPE serial`, which isn't a real
   Postgres type — the fix was a hand-written `CREATE SEQUENCE` +
   `ALTER COLUMN ... SET DEFAULT nextval(...)` migration instead; see
   `migrations/0001_dusty_omega_flight.sql` for the pattern if you hit it
   again).
3. `npm run db:migrate` against dev, verify, then repeat against
   production as part of deployment.

## Deploy database migrations

```bash
DATABASE_URL="<target connection string>" npx tsx src/lib/db/migrate.ts
```

## Deploy to Vercel

Push to `main` (GitHub integration auto-deploys), or see
[deployment.md](./deployment.md) for the CLI path.

## Update environment variables

Local: edit `.env.local`. Production: Vercel dashboard → Project Settings
→ Environment Variables → redeploy (or it applies on next deploy).

## Build Android / create APK / create AAB

Not yet set up — see [android-build.md](./android-build.md) for the full
first-time setup and ongoing build commands once the Android SDK is
installed.

## Update Capacitor

Once the Android project exists: `npm update @capacitor/core @capacitor/cli
@capacitor/android`, then `npx cap sync android`.

## Update app version

Bump `version` in `package.json` (web) following semver — patch for
bug fixes, minor for features, major for breaking changes. Once the
Android project exists, also bump `versionName` and increment
`versionCode` (integer, must always increase) in
`android/app/build.gradle`.

## Troubleshoot notifications

See [notifications.md](./notifications.md) for the full design. Quick
checks: is the `reminders` row `status = 'scheduled'`? Did the promise get
marked `completed`/`cancelled` (which should have cancelled the reminder
too — check `recordPayment`/`cancelPromiseAndReminder` in
`collections/actions.ts`)? On-device, is `@capacitor/local-notifications`
permission actually granted?

## Troubleshoot database

- Connection errors: confirm `DATABASE_URL` is set and the Neon project
  isn't suspended (free-tier Neon projects auto-suspend after inactivity
  and wake on the next query — the first request after a while may be
  slow, not broken).
- `db.transaction` errors ("No transactions support"): make sure you're
  importing `db` from `src/lib/db/index.ts` (neon-serverless/Pool), not
  rolling your own `neon-http` connection — only `neon-http` lacks
  transaction support, and it's intentionally reserved for the one-shot
  `migrate.ts`/`seed.ts` scripts.
- Schema drift: never hand-edit tables in the Neon console for anything
  beyond one-off debugging; always follow up with a real migration file so
  local/dev/prod stay in sync.

## Export data

`/reports` page has CSV export buttons (Customers, Payments, Collections,
Due), backed by `GET /api/export/*` routes, scoped to the logged-in
business and requiring authentication.

## Restore / recover

Neon supports point-in-time restore from its dashboard (Branches →
Restore). There is no separate backup job in this project — Neon's
built-in PITR is the recovery mechanism; confirm your Neon plan's retention
window meets your needs before relying on it for production data.

## Release future versions

1. Branch off `main`.
2. Make changes, add/adjust tests in `src/lib/**/__tests__/`.
3. `npm run build && npx vitest run` locally.
4. Merge to `main` → Vercel auto-deploys.
5. Run any new migrations against production (see above) — before or after
   the code deploy depending on whether the change is additive or
   destructive.
6. Bump version per semver.
