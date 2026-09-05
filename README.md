# EMF Collections — Finance Route Collection & Lending Management

A production app for a business that lends money and collects monthly
repayments (including interest) along three fixed collection routes —
Sunday, Monday, and Tuesday. Built around the workflow:

**Customer → Loan → Monthly Collection Cycle → Paid / Partial / Unpaid →
Promise Date & Time → Reminder → Payment (editable, any time) → next
month's cycle → Re-loan when a loan completes**

Original spec: [`Finance Route Collection App — Locked Claude Code Master
Prompt.md`](./Finance%20Route%20Collection%20App%20%E2%80%94%20Locked%20Claude%20Code%20Master%20Prompt.md).
The business model was later changed from weekly/N-day cycles to monthly —
see [docs/architecture.md](./docs/architecture.md) and
[docs/database.md](./docs/database.md) for the current model.

## Stack

Next.js (App Router + Server Actions) · TypeScript · Tailwind CSS ·
Drizzle ORM · Neon PostgreSQL · Auth.js (credentials) · Vercel · Capacitor
8 (Android, built on GitHub Actions — see [docs/android-build.md](./docs/android-build.md)).

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
npx vitest run       # business-logic unit tests (cycle/monthly date math)
npx eslint .          # lint
npm run build         # production build + typecheck
```

## Documentation

| Doc | Covers |
|---|---|
| [docs/architecture.md](./docs/architecture.md) | System design, directory layout, the monthly collection/loan/cycle logic |
| [docs/database.md](./docs/database.md) | Schema (loans, collection_cycles, deprecated tables), indexes, migrations, the Neon driver split |
| [docs/environment.md](./docs/environment.md) | Every env var, dev vs. prod separation |
| [docs/deployment.md](./docs/deployment.md) | Vercel + Neon deployment steps and verification |
| [docs/android-build.md](./docs/android-build.md) | Capacitor/Android setup, GitHub Actions APK builds, status/nav bar fix |
| [docs/notifications.md](./docs/notifications.md) | Reminder/promise model and the required device-sync design |
| [docs/maintenance.md](./docs/maintenance.md) | Day-to-day dev tasks: migrations, deploys, version bumps |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | Known gotchas hit during development, with the actual fix |

## Status

Web app implemented and verified end-to-end in a real browser on the
**monthly** collection model: auth, three fixed routes, customers with
multiple loans (re-loan), monthly collection cycles, dashboard
Paid/Partial/Unpaid → route drilldown, collection-mode screen, fully
editable payment history (add/edit, Cash or GPay, notes), payment
promises + reminders, follow-up (due) list, reports with from/to date
range + route/status/method filters, CSV export, DD/MM/YYYY dates
throughout, settings, light/dark theme, branded design. A customer's
"Add payment" button stays available even after their cycle is already
Paid (covers a second payment in the same month), and a loan can be
closed at any time via "Complete loan" — the outstanding amount is
editable at closing and the owner assigns a 1-5 customer rating, after
which "Re-loan" appears to start a new loan for that customer. Deployed
to Vercel production, verified with real login + database round trips.
Android is a Capacitor 8 WebView shell around the same production site —
no local SDK needed, it builds on GitHub Actions
(`.github/workflows/android-build.yml`), including a fix for the
edge-to-edge status/navigation bar and hardware back-button handling
(navigates back through app history, only prompting to exit at the
root); see [docs/android-build.md](./docs/android-build.md) for how to
grab the APK and send it to a client. Offline support and Android push
notifications are not yet built (reminders are recorded and manageable,
but nothing pings the device yet — see
[docs/notifications.md](./docs/notifications.md)).
