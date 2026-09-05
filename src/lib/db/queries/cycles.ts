import { and, asc, desc, eq, inArray, sql, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  collectionCycles,
  customers,
  paymentPromises,
  payments,
  routes,
} from "@/lib/db/schema";

export type CycleStatus = "unpaid" | "partial" | "paid";

/** Aggregate current-month numbers across the whole business, for the dashboard. */
export async function getMonthSummary(businessId: string, cycleMonth: string) {
  const [row] = await db
    .select({
      totalCustomers: sql<number>`count(*)::int`,
      paidCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'paid')::int`,
      partialCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'partial')::int`,
      unpaidCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'unpaid')::int`,
      expected: sql<string>`coalesce(sum(${collectionCycles.expectedAmount}), 0)`,
      collected: sql<string>`coalesce(sum(${collectionCycles.paidAmount}), 0)`,
    })
    .from(collectionCycles)
    .innerJoin(customers, eq(collectionCycles.customerId, customers.id))
    .where(
      and(
        eq(customers.businessId, businessId),
        eq(customers.isActive, true),
        eq(collectionCycles.cycleMonth, cycleMonth),
      ),
    );

  const expected = Number(row?.expected ?? 0);
  const collected = Number(row?.collected ?? 0);

  return {
    totalCustomers: row?.totalCustomers ?? 0,
    paidCount: row?.paidCount ?? 0,
    partialCount: row?.partialCount ?? 0,
    unpaidCount: row?.unpaidCount ?? 0,
    expected,
    collected,
    pending: Math.max(expected - collected, 0),
  };
}

/**
 * Per-route current-month numbers, for route cards. Uses correlated
 * subqueries (not a join + groupBy) so a route with zero cycles this month
 * still returns zeros correctly, and deactivated customers' cycles never
 * count — see the fan-out lesson in docs/database.md for why a plain join
 * here would be unsafe.
 */
export async function getRouteMonthSummaries(businessId: string, cycleMonth: string) {
  return db
    .select({
      routeId: routes.id,
      routeName: routes.name,
      dayOfWeek: routes.dayOfWeek,
      customerCount: sql<number>`(
        select count(*) from collection_cycles cc
        join customers c on c.id = cc.customer_id and c.is_active = true
        where cc.route_id = routes.id and cc.cycle_month = ${cycleMonth}
      )::int`,
      paidCount: sql<number>`(
        select count(*) from collection_cycles cc
        join customers c on c.id = cc.customer_id and c.is_active = true
        where cc.route_id = routes.id and cc.cycle_month = ${cycleMonth} and cc.status = 'paid'
      )::int`,
      partialCount: sql<number>`(
        select count(*) from collection_cycles cc
        join customers c on c.id = cc.customer_id and c.is_active = true
        where cc.route_id = routes.id and cc.cycle_month = ${cycleMonth} and cc.status = 'partial'
      )::int`,
      unpaidCount: sql<number>`(
        select count(*) from collection_cycles cc
        join customers c on c.id = cc.customer_id and c.is_active = true
        where cc.route_id = routes.id and cc.cycle_month = ${cycleMonth} and cc.status = 'unpaid'
      )::int`,
      expected: sql<string>`coalesce((
        select sum(cc.expected_amount) from collection_cycles cc
        join customers c on c.id = cc.customer_id and c.is_active = true
        where cc.route_id = routes.id and cc.cycle_month = ${cycleMonth}
      ), 0)`,
      collected: sql<string>`coalesce((
        select sum(cc.paid_amount) from collection_cycles cc
        join customers c on c.id = cc.customer_id and c.is_active = true
        where cc.route_id = routes.id and cc.cycle_month = ${cycleMonth}
      ), 0)`,
    })
    .from(routes)
    .where(and(eq(routes.businessId, businessId), eq(routes.isActive, true)))
    .orderBy(asc(routes.dayOfWeek));
}

export type CycleListRow = {
  cycleId: string;
  status: CycleStatus;
  expectedAmount: string;
  paidAmount: string;
  cycleMonth: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  routeSequence: number;
  loanId: string;
};

/** Customers + their cycle for a given month, optionally filtered by route/status. Powers the dashboard drilldown and the collection screen. */
export async function listCyclesForMonth(
  businessId: string,
  cycleMonth: string,
  filters: { routeId?: string; status?: CycleStatus } = {},
): Promise<CycleListRow[]> {
  const conditions: SQL[] = [
    eq(customers.businessId, businessId),
    eq(collectionCycles.cycleMonth, cycleMonth),
  ];
  if (filters.routeId) conditions.push(eq(collectionCycles.routeId, filters.routeId));
  if (filters.status) conditions.push(eq(collectionCycles.status, filters.status));

  const rows = await db
    .select({
      cycleId: collectionCycles.id,
      status: collectionCycles.status,
      expectedAmount: collectionCycles.expectedAmount,
      paidAmount: collectionCycles.paidAmount,
      cycleMonth: collectionCycles.cycleMonth,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      routeSequence: customers.routeSequence,
      loanId: collectionCycles.loanId,
    })
    .from(collectionCycles)
    .innerJoin(customers, eq(collectionCycles.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(asc(customers.routeSequence), asc(customers.name));

  return rows;
}

/** Last payment date + next promised date/time for a batch of cycles, keyed by cycleId. */
export async function getCycleFollowUpInfo(cycleIds: string[]) {
  if (cycleIds.length === 0) return new Map();

  const lastPayments = await db
    .select({
      cycleId: payments.collectionCycleId,
      paymentDate: sql<string>`max(${payments.paymentDate})`,
    })
    .from(payments)
    .where(inArray(payments.collectionCycleId, cycleIds))
    .groupBy(payments.collectionCycleId);

  const activePromises = await db
    .select({
      cycleId: paymentPromises.collectionCycleId,
      promisedDate: paymentPromises.promisedDate,
      promisedTime: paymentPromises.promisedTime,
    })
    .from(paymentPromises)
    .where(
      and(
        inArray(paymentPromises.collectionCycleId, cycleIds),
        eq(paymentPromises.status, "pending"),
      ),
    );

  const map = new Map<
    string,
    { lastPaymentDate: string | null; promisedDate: string | null; promisedTime: string | null }
  >();
  for (const id of cycleIds) {
    map.set(id, { lastPaymentDate: null, promisedDate: null, promisedTime: null });
  }
  for (const p of lastPayments) {
    if (p.cycleId) map.get(p.cycleId)!.lastPaymentDate = p.paymentDate;
  }
  for (const p of activePromises) {
    if (p.cycleId) {
      map.get(p.cycleId)!.promisedDate = p.promisedDate;
      map.get(p.cycleId)!.promisedTime = p.promisedTime;
    }
  }
  return map;
}

export async function getCycleById(businessId: string, cycleId: string) {
  const [row] = await db
    .select({
      id: collectionCycles.id,
      loanId: collectionCycles.loanId,
      customerId: collectionCycles.customerId,
      routeId: collectionCycles.routeId,
      cycleMonth: collectionCycles.cycleMonth,
      expectedAmount: collectionCycles.expectedAmount,
      paidAmount: collectionCycles.paidAmount,
      status: collectionCycles.status,
      businessId: customers.businessId,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(collectionCycles)
    .innerJoin(customers, eq(collectionCycles.customerId, customers.id))
    .where(eq(collectionCycles.id, cycleId))
    .limit(1);

  if (!row || row.businessId !== businessId) return null;
  return row;
}

/** All cycles for a loan across all months, newest first — for the customer detail history view. */
export async function listCyclesForLoan(loanId: string) {
  return db
    .select()
    .from(collectionCycles)
    .where(eq(collectionCycles.loanId, loanId))
    .orderBy(desc(collectionCycles.cycleMonth));
}
