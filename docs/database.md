# Database

PostgreSQL (Neon) + Drizzle ORM. Schema source of truth: `src/lib/db/schema.ts`.
Migrations are generated files in `src/lib/db/migrations/` — never hand-edit
the live schema outside of a migration.

## Business model (as of the monthly-collection rewrite)

EMF collects **monthly**, on one of exactly three fixed routes (Sunday,
Monday, Tuesday). The data model is:

```
customer (permanent) → loan (one or more, re-loans create new ones)
                          → collection_cycles (one row per loan per calendar month)
                              → payments (0..n, freely editable, never merged)
                              → payment_promises → reminders
```

- **`loans`** — a customer can have multiple loans over time (re-loan
  support). Each has its own `principal_amount`, `interest_amount`,
  `total_payable_amount`, `monthly_amount`, `number_of_months`, `start_date`,
  and `status` (`active`/`completed`). The owner only ever enters principal,
  interest and a loan term in months on the form — `total_payable_amount`
  (`principal + interest`) and `monthly_amount` (`total_payable_amount /
  number_of_months`) are always derived server-side (see `parseLoanForm` in
  `src/app/(app)/customers/actions.ts`), never entered directly, so they
  can't drift out of sync. `number_of_months` is nullable because loans
  created before this field existed don't have one (backfilled on migration
  by dividing total by monthly, rounded). Re-loaning never touches a
  previous loan row — it inserts a new one. Closing a loan (the "Complete
  loan" button, only shown while `active`) sets `status = 'completed'`,
  `closed_at`, an owner-entered `customer_rating` (1-5, DB-checked), and a
  `final_outstanding_amount` — an **editable** record of what was agreed
  at closing (e.g. writing off a small remainder), independent of the
  live computed balance and never fed back into any active-balance query.
- **`collection_cycles`** — one row per `(loan_id, cycle_month)`, unique
  constraint enforced. `cycle_month` is always the 1st of a month.
  `expected_amount`, `paid_amount`, and `status` (`unpaid`/`partial`/`paid`)
  are a maintained cache recomputed from `payments` on every write — never
  hand-edited, and never a source of truth on their own (see
  `recomputeCycleStatus` in `src/app/(app)/collections/actions.ts`).
  New cycles for the current month are created lazily, on the next
  dashboard/collections/customer page view on or after the 1st
  (`src/lib/db/queries/ensure-cycles.ts`) — no cron job needed.
- **`payments`** — created when money is received, and **fully editable**
  afterwards (amount/date/method/notes) via `editPayment`. Multiple partial
  payments against the same cycle are never merged — each keeps its own
  row. `client_request_id` has a unique index for idempotent add-payment
  retries.
- **`payment_promises`** / **`reminders`** — unchanged in spirit from
  before: a promise is not a payment, and the reminder is a separate
  device-notification-facing record. Both now point at `collection_cycle_id`
  instead of the old `collection_schedule_id`.

### Deprecated tables/columns (kept, not dropped)

`collection_schedules` and the inline `principal_amount` /
`interest_amount` / `total_repayment_amount` / `collection_amount` /
`cycle_days` / `outstanding_amount` columns on `customers` predate the
monthly model (the original weekly/N-day cycle design). They still hold
their historical rows/values and `payments.collection_schedule_id` /
`payment_promises.collection_schedule_id` are still there (now nullable)
pointing at them, but **no current code reads or writes any of this** —
loans/cycles are the only source of truth going forward. They were kept
rather than dropped so the migration is safe and reversible; a future
cleanup migration can drop them once you're confident nothing depends on
them.

| Table | Purpose |
|---|---|
| `businesses` | One row per business (V1 seeds exactly one). Holds currency, timezone, default reminder lead time, default payment method. |
| `users` | Login accounts. `role`: `owner` \| `collector`. Password stored as bcrypt hash. |
| `routes` | Exactly three active rows in practice — Sunday/Monday/Tuesday (`day_of_week` 0/1/2) — though the column itself still accepts any of 0-6. |
| `customers` | Permanent borrower record. Route assignment + profile fields only now; loan financials live on `loans`. |
| `loans` | See above. |
| `collection_cycles` | See above. |
| `collection_schedules` | **Deprecated**, see above. |
| `payments` | Created when money is received; editable afterwards. `client_request_id` unique index for idempotent retries. |
| `payment_promises` | A promise ("I'll pay Wednesday 5pm") is explicitly separate from a payment. |
| `reminders` | Device-notification-facing record, separate from the promise. `notification_id` is a Postgres sequence-backed auto-incrementing int, used as the stable Capacitor Local Notification ID once notification scheduling is wired up (see [notifications.md](./notifications.md)). |
| `customer_notes` | Freeform notes timeline per customer. |
| `audit_logs` | Minimum traceability scaffold (table/record/action/old/new/who/when) for future full audit-log UI. |

## Status enums

- `loan_status`: active, completed
- `cycle_status`: unpaid, partial, paid
- `collection_status` (deprecated, `collection_schedules` only): pending, paid, partial, due, rescheduled, cancelled, overdue
- `promise_status`: pending, completed, cancelled, expired
- `reminder_status`: scheduled, sent, cancelled, completed
- `payment_method`: cash, gpay (current — the only two the payment form offers), plus upi, bank_transfer, other (legacy values, additive so old rows still display correctly)

## Indexes

Every foreign key used in a hot lookup path is indexed: `route_id`,
`loan_id`+`cycle_month` (unique), `customer_id`, `status`, `cycle_month`,
`collection_cycle_id` on payments/promises, and reminder `scheduled_at`.
See `schema.ts` for the exact index list — every `index(...)` and
`uniqueIndex(...)` call maps directly to what's on the live database.

## A hard-won lesson on aggregate queries across this join

`loans → collection_cycles` is one-to-many. Computing a per-customer
"outstanding balance" by joining loans to cycles and then
`sum(loan.total_payable_amount)` in the same query **double/multi-counts**
the loan's total once per cycle row (a classic SQL fan-out bug — hit and
fixed during development, see `listCustomers` in
`src/lib/db/queries/customers.ts`). The fix: compute each loan's
paid-to-date via a **correlated scalar subquery** (not a join), then sum
per-loan outstanding across loans. Any new query that needs a value from
both `loans` and `collection_cycles` together should use the same pattern.

## Running migrations

```bash
npm run db:generate   # after editing schema.ts, generates a new migration file
npm run db:migrate    # applies pending migrations to DATABASE_URL
npm run db:studio     # opens Drizzle Studio against DATABASE_URL
npm run db:seed       # idempotent: creates the business + owner user if missing
```

`drizzle.config.ts` and `src/lib/db/migrate.ts` load `.env.local` via
`dotenv` — the app itself relies on Next.js's built-in `.env.local` loading.

## A note on the Neon driver split

`src/lib/db/index.ts` (used by the running app) uses
`drizzle-orm/neon-serverless` with a WebSocket `Pool`, because several
server actions use `db.transaction(...)` (multi-statement atomic writes,
e.g. inserting a payment + updating a schedule + updating a customer's
outstanding balance together) and the plain HTTP driver
(`drizzle-orm/neon-http`) does not support transactions. `migrate.ts` and
`seed.ts` are one-shot scripts that don't need transactions, so they use the
lighter `neon-http` driver directly instead of pulling in `ws`.

The `DATABASE_URL` you were given already points at Neon's pooled endpoint
(`-pooler` in the hostname), which is the correct target for a `Pool` from a
serverless function environment like Vercel.
