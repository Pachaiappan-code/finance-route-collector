# Architecture

## Overview

```
                    ANDROID USER
                         |
                         v
                Capacitor Android App
                         |
                         | HTTPS
                         v
                      Vercel
              +----------+----------+
              |                     |
         Next.js UI            API / Server Actions
                                    |
                                    v
                              Neon PostgreSQL
```

The Android app (Phase 9, not yet built — see [android-build.md](./android-build.md))
wraps this same Next.js web app in a Capacitor WebView. There is no separate
mobile API; the WebView talks to the same Next.js server actions and routes
as the desktop browser over HTTPS. The Android app never talks to Neon
directly and never holds `DATABASE_URL`.

## Stack

| Layer | Technology |
|---|---|
| Hosting | Vercel |
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM (`drizzle-orm/neon-serverless`, WebSocket pool — needed for transactions; `neon-http` is used only for one-shot scripts: migrate, seed) |
| Auth | Auth.js (next-auth v5), credentials provider, JWT sessions |
| Validation | Zod, enforced server-side in every server action |
| Mobile | Capacitor 8, built on GitHub Actions (no local Android SDK needed) — see [android-build.md](./android-build.md) |

## Directory layout

```
src/
  app/
    (app)/            authenticated route group: layout with bottom nav
      dashboard/       monthly summary + /[status]/[routeId] drilldown (Paid/Partial/Unpaid × route)
      routes/
      customers/
        [id]/
          reloan/      re-loan form
      collections/     route list + collection mode (Paid/Due/Partial) for the current month
      due/             follow-up list: partial + unpaid cycles, all routes
      reminders/
      reports/         date-range + route/status/method filters
      settings/
      more/            secondary nav hub (routes/reminders/reports/settings)
    api/
      auth/[...nextauth]/
      export/          CSV export endpoints
    login/
  components/          shared UI (bottom nav, cycle-list, etc.)
  lib/
    db/                schema, connection, migrations, queries/
    auth/              Auth.js config + type augmentation
    calculations/      cycle date math + monthly-cycle-month helpers
    validation/        Zod schemas per entity
    utils/             format, csv, DD/MM/YYYY date-display helpers
  middleware.ts        route protection (redirects unauthenticated users to /login)
```

Business logic that mutates data lives in `actions.ts` files co-located with
each route group (`app/(app)/collections/actions.ts`, `app/(app)/customers/actions.ts`,
etc.) and is called from Server Components/Client Components as Next.js
Server Actions. Read queries live in `lib/db/queries/`.

## Primary workflow (highest priority) — monthly collection model

```
Customer (permanent) → Loan → Monthly Collection Cycle → Paid / Partial / Unpaid
  → Promise Date & Time → Reminder → Payment (editable, any time) → next month's cycle
```

Collection is **monthly**, on one of exactly three fixed routes (Sunday,
Monday, Tuesday). Implemented in `src/app/(app)/collections/actions.ts`:

- `recordPayment` — used by the Paid/Partial buttons and the customer
  page's "Add payment". Recomputes the cycle's cached `paid_amount`/`status`
  from the sum of its actual `payments` rows every time (never trusts a
  running total). Reaching the expected amount marks the cycle `paid` and
  resolves any pending promise/reminder on it. Payments are never
  restricted to a specific day — any cycle can receive a payment at any
  time, and multiple partial payments stay as separate rows.
- `editPayment` — payments are never locked; amount/date/method/notes can
  be corrected after the fact, and the cycle is recomputed afterward.
- `recordDue` — creates a `payment_promises` row (a promise is never a
  payment) and a `reminders` row offset by the selected lead time.
- `createReLoan` (in `customers/actions.ts`) — inserts a brand-new `loans`
  row (and its first `collection_cycles` row) for a customer whose current
  loan is done. The old loan and everything under it is never touched.
- Monthly rollover is lazy, not cron-based: `ensureCurrentMonthCycles`
  (`lib/db/queries/ensure-cycles.ts`) upserts a cycle for every active loan
  missing one for the current month, called at the top of the
  dashboard/collections/customer-detail pages. Safe to call repeatedly —
  the `(loan_id, cycle_month)` unique constraint makes it idempotent.
- Idempotency: payments carry a `clientRequestId` with a unique index, so
  retrying a submission (e.g. after a flaky network) cannot double-record
  a payment.

## Multi-business readiness

Every business-owned table carries `business_id`. V1 seeds exactly one
`businesses` row and has no UI for switching businesses, but the schema and
every query are already scoped by `business_id`, so adding a business
switcher later does not require a data model change.
