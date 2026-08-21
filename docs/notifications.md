# Notifications

## Current state (web, this phase)

`payment_promises` and `reminders` are fully implemented server-side
(`src/app/(app)/collections/actions.ts`). When a collector taps DUE:

1. The `collection_schedules` row's status becomes `due`.
2. A `payment_promises` row is created (`status: pending`) — a promise is
   never a payment.
3. A `reminders` row is created with `scheduled_at` computed from the
   promised date/time minus the selected lead time (15 min / 30 min / 1
   hour / exact time — default 15 min, configurable per-business in
   Settings), and `status: scheduled`.

The `/reminders` page lists all `scheduled` reminders and lets you cancel
one (which also cancels the underlying promise).

When a payment is recorded against a schedule that has a pending promise,
`recordPayment` automatically marks that promise `completed` and its
reminder `completed` — no orphaned reminders after a payment lands.

## What's not built yet: the Android device notification

There is no Capacitor app yet (see [android-build.md](./android-build.md)),
so nothing currently pushes an actual Android notification. The `reminders`
table's `notification_id` column (an auto-incrementing integer) exists
specifically to become the stable Capacitor Local Notification ID once the
Android app is built — this is intentional forward design, not a bug.

## Required sync routine (build this alongside the Android app)

On app open/resume, per section 24 of the spec:

1. Fetch all `reminders` where `status = 'scheduled'` for the logged-in
   business (a small API route, e.g. `GET /api/reminders/sync`, already
   easy to add on top of `listUpcomingReminders`).
2. Compare against the notifications currently scheduled on-device via
   `@capacitor/local-notifications`' `getPending()`.
3. Schedule any reminder missing from the device (using its
   `notification_id` as the Capacitor notification `id`).
4. Cancel any on-device notification whose `reminders` row is no longer
   `scheduled` (payment completed, promise cancelled, or promise date
   changed — server-side cancellation always happens first; the device
   sync is what makes the phone match server state).
5. Because `notification_id` is unique and stable per reminder row, this
   sync is naturally idempotent — re-running it never double-schedules.

Deep link: schedule each notification with `extra: { customerId }`, and
handle the `localNotificationActionPerformed` event by navigating to
`/customers/{customerId}`.
