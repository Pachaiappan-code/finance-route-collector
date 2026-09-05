import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Monthly rollover: makes sure every active loan for this business has a
 * collection_cycles row for the given month, creating one (status unpaid,
 * expected = loan.monthlyAmount) if missing. Safe to call on every
 * dashboard/collections page load — the unique (loan_id, cycle_month)
 * constraint makes this an idempotent upsert, not a duplicate risk.
 *
 * This is deliberately "lazy" (triggered by the next page view after the
 * 1st of the month) rather than a scheduled job, since that needs no extra
 * infrastructure (no Vercel Cron) and is exactly as correct for a
 * single-business app checked at least daily.
 */
export async function ensureCurrentMonthCycles(businessId: string, cycleMonth: string) {
  await db.execute(sql`
    insert into collection_cycles (loan_id, customer_id, route_id, cycle_month, expected_amount, status)
    select l.id, l.customer_id, c.route_id, ${cycleMonth}::date, l.monthly_amount, 'unpaid'
    from loans l
    join customers c on c.id = l.customer_id
    where l.status = 'active'
      and c.business_id = ${businessId}
      and c.is_active = true
    on conflict (loan_id, cycle_month) do nothing
  `);
}
