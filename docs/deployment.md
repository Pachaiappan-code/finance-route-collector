# Deployment

## Web (Vercel)

### One-time setup

1. In the Vercel dashboard: **Add New → Project → Import** the
   `finance-route-collector` GitHub repo. Vercel auto-detects Next.js —
   no custom build command needed.
2. Project Settings → Environment Variables: add `DATABASE_URL` (your
   **production** Neon connection string, not the dev one) and
   `AUTH_SECRET` (a separately-generated value) for the Production
   environment.
3. Deploy. Vercel builds on every push to `main` by default via its GitHub
   integration — no `VERCEL_TOKEN` needed for this path.

### CLI deploy (optional alternative)

Only needed if you want to deploy from your machine instead of via GitHub
push:

```bash
npx vercel --token=$VERCEL_TOKEN --prod
```

`VERCEL_TOKEN` is a personal token from
https://vercel.com/account/tokens — export it in your shell, never commit
it, never put it in `.env.example` with a real value.

### Verifying a deploy

After deploy, confirm:

```bash
curl -I https://<your-production-domain>/login       # 200
curl -I https://<your-production-domain>/api/export/customers   # 401 (unauthenticated) — proves the route + auth guard are live
```

Then log in through the browser and confirm the dashboard loads real
numbers (proves `DATABASE_URL` and `AUTH_SECRET` are correctly configured
in Vercel).

## Database (Neon)

Migrations are not run automatically by Vercel. Run them explicitly,
pointed at production, whenever the schema changes:

```bash
DATABASE_URL="<production connection string>" npx tsx src/lib/db/migrate.ts
```

Run this **before** deploying code that depends on the new schema, and
**after** confirming the migration is backward-compatible with the code
currently live (additive changes — new nullable columns, new tables — are
always safe to run ahead of the code deploy; destructive changes need a
two-step rollout).

## Android

See [android-build.md](./android-build.md). Deferred in this project until
Android Studio / the Android SDK is installed on a build machine — the web
app is fully usable via mobile browser in the meantime (it's built
mobile-first with a bottom nav, per the spec).

## Full "deploy the app" checklist

1. `npm run build` locally — must succeed.
2. `npx vitest run` — must pass.
3. Confirm `DATABASE_URL` / `AUTH_SECRET` are set in Vercel for Production.
4. Run pending migrations against the production database (see above).
5. Push to `main` (or `vercel --prod` if deploying via CLI).
6. Verify the production URL, `/login`, and one authenticated page.
7. Android build/APK — only if the Android SDK is set up; otherwise report
   it as a remaining manual step, never claim it succeeded.
