# Troubleshooting

## "No transactions support in neon-http driver"

You're using the wrong Neon driver for a code path that needs
`db.transaction(...)`. The app's runtime `db` (from `src/lib/db/index.ts`)
uses `drizzle-orm/neon-serverless` specifically to support this — if you
see this error, something is importing a `neon-http`-based `db` instance
instead. This was hit and fixed during initial development; see
[database.md](./database.md#a-note-on-the-neon-driver-split).

## Login redirects back to `/login` immediately after signing in

Check `AUTH_SECRET` is set (missing it breaks JWT encryption/decryption
silently in some Auth.js versions) and that the `users.email` you're
signing in with is lowercase-normalized (the app lowercases on both seed
and login, but data inserted by hand might not be).

## Dashboard / collections numbers look wrong

`getDashboardData` computes "today" using the business timezone
(`Asia/Kolkata`, from `src/lib/calculations/cycle.ts`), not the server's
local timezone. If you're testing from a server with a different system
timezone, don't assume `new Date()` naive comparisons apply — day-of-week
and date-string logic always goes through `getDayOfWeek`/`toCalendarDate`.

## A "New route"/"New customer" form re-renders instead of saving when tested with curl

Server Actions are not plain HTTP POST endpoints — the browser's
progressive-enhancement form submission includes an internal action
reference that a raw `curl -d field=value` POST won't replicate. Don't try
to smoke-test server actions with curl; use a real browser (Playwright, or
by hand) if you need to verify a form end-to-end.

## `drizzle-kit generate` emits `ALTER COLUMN ... SET DATA TYPE serial`

This is invalid SQL — `serial` is a `CREATE TABLE`-only shorthand, not a
real type usable in `ALTER COLUMN`. Hand-edit the generated migration to
`CREATE SEQUENCE` + `ALTER COLUMN ... SET DEFAULT nextval(...)` instead
(and remember Neon's HTTP-based migrator needs
`--> statement-breakpoint` between statements — it can't run multiple SQL
commands in one prepared statement). See migration `0001_dusty_omega_flight.sql`
for the working pattern.

## CLI output shows an unexpected "tip" mentioning an unfamiliar domain

Both `dotenv` and some other CLI tools print rotating promotional "tip"
lines to stdout after running. These are static strings shipped in the
published npm package (verified via `grep` into `node_modules` during
initial development for this exact project), not a live network fetch or
an attack — but treat any URL surfaced this way as untrusted and don't
open it from an agent context regardless.

## Every route 404s on Vercel, including `/` and static assets, despite a successful build

Check the project's **Framework Preset** (Project Settings → General →
Build & Development Settings, or `GET /v9/projects/<id>` → `framework`
field via the API). If it's `null`, Vercel silently builds with the
generic `@vercel/static-build` builder instead of `@vercel/next` — the
build log shows `"detectedFramework": {"status": "skipped"}` and no
`.vercel/output/functions/` directory gets produced, so literally nothing
is servable. This happened on this project because it was auto-created by
Vercel's GitHub App import before framework auto-detection ran properly.
Fix: set Framework Preset to **Next.js** (dashboard dropdown, or
`PATCH /v9/projects/<id>` with `{"framework": "nextjs"}`), then redeploy.
The build log should then show `Detected Next.js version: ...` and
`Applying modifyConfig from Vercel` — if you don't see those two lines,
the framework still isn't being detected.

## Production URL redirects to `vercel.com/sso-api` or a bare `.vercel.app` URL 404s for real users

Vercel's **Deployment Protection** (team SSO gate) can be enabled by
default and blocks anyone without dashboard access from reaching the app
at all — including the `.vercel.app` production domain, not just preview
deployments. Check via `GET /v9/projects/<id>` → `ssoProtection`; if it's
not `null`, real users are locked out. Either disable it
(`PATCH /v9/projects/<id>` with `{"ssoProtection": null}`) if the app's
own login screen is sufficient protection, or configure a Protection
Bypass token if you need to keep it on. This is a genuine access-control
change — confirm with whoever owns the Vercel account before flipping it.

## Neon connection is slow on the first request after a while

Expected on Neon's free tier — the compute suspends after a period of
inactivity and cold-starts on the next query. Not a bug in this app.
