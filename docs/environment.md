# Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit
`.env.local` — it's gitignored.

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | Server only (`src/lib/db`) | Neon Postgres connection string. Never exposed to the client — no `NEXT_PUBLIC_` prefix, never imported into a Client Component. |
| `AUTH_SECRET` | Yes | Server only (`src/lib/auth`) | Encrypts/signs Auth.js JWT sessions. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Use a **different** value in production than in development. |
| `VERCEL_TOKEN` | Only for CLI deploys | Local shell / CI, never the app | Only needed if deploying via `vercel --token=...` instead of Vercel's GitHub integration. Not read by the Next.js app at runtime. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_BUSINESS_NAME` | No | `npm run db:seed` | Optional overrides for the one-time seed script; defaults exist. |

## Development vs production

Use two separate Neon databases/branches: one for local development, one
for production. Set `DATABASE_URL` in `.env.local` (dev) and separately in
the Vercel project's Environment Variables for the **Production**
environment (prod). Never point local development at the production
database, and never seed production with the dev seed script's throwaway
data.

## Where each secret lives

- Local dev: `.env.local` (gitignored, on your machine only).
- Vercel: Project Settings → Environment Variables. Set `DATABASE_URL` and
  `AUTH_SECRET` for the Production (and, if you use one, Preview)
  environment. Vercel encrypts these at rest and never exposes them to the
  client bundle unless you deliberately prefix a variable with
  `NEXT_PUBLIC_` — do not do that for anything in this table.
- Android signing / Google Play service account: see
  [android-build.md](./android-build.md) — these never go in `.env*` at all.
