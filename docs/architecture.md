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
| Mobile | Capacitor (deferred until Android SDK is available) |

## Directory layout

```
src/
  app/
    (app)/            authenticated route group: layout with bottom nav
      dashboard/
      routes/
      customers/
      collections/     "Today's Routes" + collection mode (Paid/Due/Partial)
      due/
      reminders/
      reports/
      settings/
      more/            secondary nav hub (routes/reminders/reports/settings)
    api/
      auth/[...nextauth]/
      export/          CSV export endpoints
    login/
  components/          shared UI (bottom nav, etc.)
  lib/
    db/                schema, connection, migrations, queries/
    auth/              Auth.js config + type augmentation
    calculations/      cycle date math (5/7/10/custom day cycles)
    validation/        Zod schemas per entity
    utils/             format, csv helpers
  middleware.ts → proxy.ts   route protection (redirects unauthenticated users to /login)
```

Business logic that mutates data lives in `actions.ts` files co-located with
each route group (`app/(app)/collections/actions.ts`, etc.) and is called
from Server Components/Client Components as Next.js Server Actions. Read
queries live in `lib/db/queries/`.

## Primary workflow (highest priority)

```
Route → Customer → Expected Collection → Paid / Due / Partial
  → Promise Date & Time → Reminder → Payment → Next Collection Cycle
```

Implemented in `src/app/(app)/collections/actions.ts`:

- `recordPayment` — used by both the PAID and PARTIAL buttons. If the total
  paid against a schedule reaches the expected amount, status becomes
  `paid` and — only if this is the customer's most-recent schedule, to
  avoid forking the cycle chain when settling an old overdue schedule out
  of order — the next collection schedule is generated via
  `calculateNextCollectionDate`. Otherwise status becomes `partial`.
- `recordDue` — creates a `payment_promises` row (a promise is never a
  payment) and a `reminders` row offset by the selected lead time.
- Idempotency: payments carry a `clientRequestId` with a unique index, so
  retrying a submission (e.g. after a flaky network) cannot double-record
  a payment.

## Multi-business readiness

Every business-owned table carries `business_id`. V1 seeds exactly one
`businesses` row and has no UI for switching businesses, but the schema and
every query are already scoped by `business_id`, so adding a business
switcher later does not require a data model change.
