import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  collectionSchedules,
  customers,
  paymentPromises,
  payments,
  routes,
} from "@/lib/db/schema";

export async function getTodaysRoutesSummary(
  businessId: string,
  dayOfWeek: number,
  dateStr: string,
) {
  return db
    .select({
      id: routes.id,
      name: routes.name,
      customerCount: sql<number>`count(${collectionSchedules.id})::int`,
      paidCount: sql<number>`count(${collectionSchedules.id}) filter (where ${collectionSchedules.status} = 'paid')::int`,
      expectedAmount: sql<string>`coalesce(sum(${collectionSchedules.expectedAmount}), 0)`,
    })
    .from(routes)
    .leftJoin(
      collectionSchedules,
      and(
        eq(collectionSchedules.routeId, routes.id),
        eq(collectionSchedules.scheduledDate, dateStr),
      ),
    )
    .where(
      and(
        eq(routes.businessId, businessId),
        eq(routes.dayOfWeek, dayOfWeek),
        eq(routes.isActive, true),
      ),
    )
    .groupBy(routes.id)
    .orderBy(asc(routes.routeOrder), asc(routes.name));
}

export async function getTodaysScheduleForRoute(routeId: string, dateStr: string) {
  const rows = await db
    .select({
      scheduleId: collectionSchedules.id,
      status: collectionSchedules.status,
      expectedAmount: collectionSchedules.expectedAmount,
      cycleNumber: collectionSchedules.cycleNumber,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      routeSequence: customers.routeSequence,
      outstandingAmount: customers.outstandingAmount,
    })
    .from(collectionSchedules)
    .innerJoin(customers, eq(collectionSchedules.customerId, customers.id))
    .where(
      and(
        eq(collectionSchedules.routeId, routeId),
        eq(collectionSchedules.scheduledDate, dateStr),
      ),
    )
    .orderBy(asc(customers.routeSequence), asc(customers.name));

  return rows;
}

export async function getScheduleForCollection(businessId: string, scheduleId: string) {
  const [row] = await db
    .select({
      scheduleId: collectionSchedules.id,
      status: collectionSchedules.status,
      expectedAmount: collectionSchedules.expectedAmount,
      scheduledDate: collectionSchedules.scheduledDate,
      cycleNumber: collectionSchedules.cycleNumber,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      businessId: customers.businessId,
      cycleDays: customers.cycleDays,
      routeId: customers.routeId,
      outstandingAmount: customers.outstandingAmount,
    })
    .from(collectionSchedules)
    .innerJoin(customers, eq(collectionSchedules.customerId, customers.id))
    .where(eq(collectionSchedules.id, scheduleId))
    .limit(1);

  if (!row || row.businessId !== businessId) return null;
  return row;
}

export async function getLatestPromiseForSchedule(scheduleId: string) {
  const [promise] = await db
    .select()
    .from(paymentPromises)
    .where(
      and(
        eq(paymentPromises.collectionScheduleId, scheduleId),
        eq(paymentPromises.status, "pending"),
      ),
    )
    .limit(1);
  return promise ?? null;
}

export async function getPaidTotalForSchedule(scheduleId: string): Promise<number> {
  const rows = await db
    .select({ amount: payments.amount })
    .from(payments)
    .where(eq(payments.collectionScheduleId, scheduleId));
  return rows.reduce((sum, r) => sum + Number(r.amount), 0);
}
