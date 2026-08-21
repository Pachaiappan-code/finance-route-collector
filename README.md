# EMF Collections — Finance Route Collection & Lending Management

A production-oriented app for a business that lends money and collects
repayments (including interest) along recurring collection routes. Built
around the workflow:

**Route → Customer → Expected Collection → Paid / Due / Partial →
Promise Date & Time → Reminder → Payment → Next Collection Cycle**

Full spec: [`Finance Route Collection App — Locked Claude Code Master
Prompt.md`](./Finance%20Route%20Collection%20App%20%E2%80%94%20Locked%20Claude%20Code%20Master%20Prompt.md).

## Stack

Next.js (App Router + Server Actions) · TypeScript · Tailwind CSS ·
Drizzle ORM · Neon PostgreSQL · Auth.js (credentials) · Vercel · Capacitor
(Android, deferred — see [docs/android-build.md](./docs/android-build.md)).

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (Neon) and AUTH_SECRET
npm run db:migrate           # apply schema to your dev database
npm run db:seed              # creates the business + first owner login
npm run dev                  # http://localhost:3000
```

See [docs/environment.md](./docs/environment.md) for what each variable
does and where it's allowed to live.

## Testing

```bash
npx vitest run   # business-logic unit tests (cycle date math, etc.)
npm run build    # production build + typecheck
```

## Documentation

| Doc | Covers |
|---|---|
| [docs/architecture.md](./docs/architecture.md) | System design, directory layout, the core Paid/Due/Partial + next-cycle logic |
| [docs/database.md](./docs/database.md) | Schema, indexes, migrations, the Neon driver split |
| [docs/environment.md](./docs/environment.md) | Every env var, dev vs. prod separation |
| [docs/deployment.md](./docs/deployment.md) | Vercel + Neon deployment steps and verification |
| [docs/android-build.md](./docs/android-build.md) | Capacitor/Android setup (not yet started — SDK not installed) |
| [docs/notifications.md](./docs/notifications.md) | Reminder/promise model and the required device-sync design |
| [docs/maintenance.md](./docs/maintenance.md) | Day-to-day dev tasks: migrations, deploys, version bumps |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | Known gotchas hit during development, with the actual fix |

## Status

Web app (Phases 0–8 of the spec) is implemented and verified end-to-end in
a real browser: auth, routes, customers, collection schedules, the
Paid/Due/Partial collection-mode screen, next-cycle generation, payment
promises + reminders, due list, reports, CSV export, settings. Offline
support (Phase 9) and the Android app (Phase 9/52) are not yet built —
see the docs above for what's designed but not implemented.
