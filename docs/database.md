# Database

PostgreSQL (Neon) + Drizzle ORM. Schema source of truth: `src/lib/db/schema.ts`.
Migrations are generated files in `src/lib/db/migrations/` — never hand-edit
the live schema outside of a migration.

## Tables

| Table | Purpose |
|---|---|
| `businesses` | One row per business (V1 seeds exactly one). Holds currency, timezone, default reminder lead time, default payment method. |
| `users` | Login accounts. `role`: `owner` \| `collector`. Password stored as bcrypt hash. |
| `routes` | A named route on a specific `day_of_week` (0=Sunday..6=Saturday). Never hardcoded — always database rows. |
| `customers` | Borrower/collection target. Carries route assignment, manual finance fields (principal/interest/total repayment/per-cycle collection amount), `cycle_days`, `outstanding_amount`. |
| `collection_schedules` | One row per expected collection event. **Never overwritten** — status transitions in place, and a new row is inserted for the next cycle instead of mutating the old one. |
| `payments` | Created only when money is actually received. `client_request_id` has a unique index for idempotent retries. |
| `payment_promises` | A promise ("I'll pay Wednesday 5pm") is explicitly separate from a payment. |
| `reminders` | Device-notification-facing record, separate from the promise. `notification_id` is a Postgres sequence-backed auto-incrementing int, used as the stable Capacitor Local Notification ID once the Android app exists. |
| `customer_notes` | Freeform notes timeline per customer. |
| `audit_logs` | Minimum traceability scaffold (table/record/action/old/new/who/when) for future full audit-log UI. |

## Status enums

- `collection_status`: pending, paid, partial, due, rescheduled, cancelled, overdue
- `promise_status`: pending, completed, cancelled, expired
- `reminder_status`: scheduled, sent, cancelled, completed
- `payment_method`: cash, upi, bank_transfer, other

## Indexes

Every foreign key used in a hot lookup path is indexed: `route_id`,
`scheduled_date`, `customer phone`, `customer_id`, `status`, and reminder
`scheduled_at`. See `schema.ts` for the exact index list — every `index(...)`
and `uniqueIndex(...)` call maps directly to what's on the live database.

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
