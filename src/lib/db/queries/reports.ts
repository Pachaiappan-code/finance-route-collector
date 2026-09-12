import { and, asc, between, desc, eq, gte, lte, sql, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionCycles, customers, loans, payments, routes } from "@/lib/db/schema";

export type ReportFilters = {
  routeId?: string;
  status?: "paid" | "partial" | "unpaid";
  customerId?: string;
  paymentMethod?: "cash" | "gpay";
};

/** Collection-cycle summary for every calendar month touched by [from, to] — e.g. 01/08 to 05/09 includes both August and September cycles. */
export async function getReportSummary(
  businessId: string,
  from: string,
  to: string,
  filters: ReportFilters = {},
) {
  const fromMonth = `${from.slice(0, 7)}-01`;
  const toMonth = `${to.slice(0, 7)}-01`;

  const conditions: SQL[] = [
    eq(customers.businessId, businessId),
    gte(collectionCycles.cycleMonth, fromMonth),
    lte(collectionCycles.cycleMonth, toMonth),
  ];
  if (filters.routeId) conditions.push(eq(collectionCycles.routeId, filters.routeId));
  if (filters.status) conditions.push(eq(collectionCycles.status, filters.status));

  const [row] = await db
    .select({
      totalCustomers: sql<number>`count(distinct ${collectionCycles.customerId})::int`,
      paidCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'paid')::int`,
      partialCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'partial')::int`,
      unpaidCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'unpaid')::int`,
      expected: sql<string>`coalesce(sum(${collectionCycles.expectedAmount}), 0)`,
      collected: sql<string>`coalesce(sum(${collectionCycles.paidAmount}), 0)`,
    })
    .from(collectionCycles)
    .innerJoin(customers, eq(collectionCycles.customerId, customers.id))
    .where(and(...conditions));

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

export async function getReportRouteBreakdown(businessId: string, from: string, to: string) {
  const fromMonth = `${from.slice(0, 7)}-01`;
  const toMonth = `${to.slice(0, 7)}-01`;

  return db
    .select({
      routeId: routes.id,
      routeName: routes.name,
      customerCount: sql<number>`count(distinct ${collectionCycles.customerId})::int`,
      paidCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'paid')::int`,
      partialCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'partial')::int`,
      unpaidCount: sql<number>`count(*) filter (where ${collectionCycles.status} = 'unpaid')::int`,
      expected: sql<string>`coalesce(sum(${collectionCycles.expectedAmount}), 0)`,
      collected: sql<string>`coalesce(sum(${collectionCycles.paidAmount}), 0)`,
    })
    .from(routes)
    .leftJoin(
      collectionCycles,
      and(
        eq(collectionCycles.routeId, routes.id),
        gte(collectionCycles.cycleMonth, fromMonth),
        lte(collectionCycles.cycleMonth, toMonth),
      ),
    )
    .where(eq(routes.businessId, businessId))
    .groupBy(routes.id)
    .orderBy(asc(routes.dayOfWeek));
}

/** Individual payment transactions with payment_date in [from, to] — the literal date range, not month-truncated. */
export async function getReportPayments(
  businessId: string,
  from: string,
  to: string,
  filters: ReportFilters = {},
) {
  const conditions: SQL[] = [
    eq(customers.businessId, businessId),
    between(payments.paymentDate, from, to),
  ];
  if (filters.routeId) conditions.push(eq(collectionCycles.routeId, filters.routeId));
  if (filters.customerId) conditions.push(eq(payments.customerId, filters.customerId));
  if (filters.paymentMethod) conditions.push(eq(payments.paymentMethod, filters.paymentMethod));

  return db
    .select({
      id: payments.id,
      customerName: customers.name,
      routeName: routes.name,
      loanId: collectionCycles.loanId,
      cycleMonth: collectionCycles.cycleMonth,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      paymentMethod: payments.paymentMethod,
      notes: payments.notes,
    })
    .from(payments)
    .innerJoin(customers, eq(payments.customerId, customers.id))
    .leftJoin(collectionCycles, eq(payments.collectionCycleId, collectionCycles.id))
    .leftJoin(routes, eq(collectionCycles.routeId, routes.id))
    .where(and(...conditions))
    .orderBy(desc(payments.paymentDate));
}

/**
 * Money the business paid OUT — loan principal disbursed to customers,
 * dated by the loan's start date. This is the "debit" side of the ledger;
 * getReportPayments (customer payments received) is the "credit" side.
 */
export async function getReportDisbursements(
  businessId: string,
  from: string,
  to: string,
  filters: { routeId?: string } = {},
) {
  const conditions: SQL[] = [
    eq(customers.businessId, businessId),
    between(loans.startDate, from, to),
  ];
  if (filters.routeId) conditions.push(eq(customers.routeId, filters.routeId));

  return db
    .select({
      loanId: loans.id,
      customerName: customers.name,
      routeName: routes.name,
      principalAmount: loans.principalAmount,
      interestAmount: loans.interestAmount,
      totalPayableAmount: loans.totalPayableAmount,
      numberOfMonths: loans.numberOfMonths,
      startDate: loans.startDate,
    })
    .from(loans)
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .leftJoin(routes, eq(customers.routeId, routes.id))
    .where(and(...conditions))
    .orderBy(desc(loans.startDate));
}

/** Every loan (original + re-loans), with collected-to-date and balance computed from its cycles. */
export async function getReportLoans(businessId: string, filters: { status?: "active" | "completed" } = {}) {
  const conditions: SQL[] = [eq(customers.businessId, businessId)];
  if (filters.status) conditions.push(eq(loans.status, filters.status));

  return db
    .select({
      loanId: loans.id,
      customerName: customers.name,
      principalAmount: loans.principalAmount,
      totalPayableAmount: loans.totalPayableAmount,
      collected: sql<string>`coalesce((
        select sum(${collectionCycles.paidAmount}) from ${collectionCycles} where ${collectionCycles.loanId} = ${loans.id}
      ), 0)`,
      numberOfMonths: loans.numberOfMonths,
      monthsPaid: sql<number>`coalesce((
        select count(*) from ${collectionCycles} where ${collectionCycles.loanId} = ${loans.id} and ${collectionCycles.status} = 'paid'
      ), 0)::int`,
      status: loans.status,
      startDate: loans.startDate,
      finalOutstandingAmount: loans.finalOutstandingAmount,
      customerRating: loans.customerRating,
      closedAt: loans.closedAt,
      lastPaymentDate: sql<string | null>`(
        select max(p.payment_date) from payments p
        inner join collection_cycles cc on cc.id = p.collection_cycle_id
        where cc.loan_id = ${loans.id}
      )`,
    })
    .from(loans)
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(loans.startDate));
}
