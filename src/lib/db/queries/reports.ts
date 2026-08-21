import { and, asc, between, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionSchedules, customers, routes } from "@/lib/db/schema";
import { toCalendarDate } from "@/lib/calculations/cycle";
import { addDays } from "date-fns";

export async function getRouteReport(businessId: string, dateStr: string) {
  return db
    .select({
      routeId: routes.id,
      routeName: routes.name,
      customerCount: sql<number>`count(${collectionSchedules.id})::int`,
      expected: sql<string>`coalesce(sum(${collectionSchedules.expectedAmount}), 0)`,
      collected: sql<string>`coalesce(sum(${collectionSchedules.expectedAmount}) filter (where ${collectionSchedules.status} = 'paid'), 0)`,
    })
    .from(routes)
    .leftJoin(
      collectionSchedules,
      and(
        eq(collectionSchedules.routeId, routes.id),
        eq(collectionSchedules.scheduledDate, dateStr),
      ),
    )
    .where(eq(routes.businessId, businessId))
    .groupBy(routes.id)
    .orderBy(asc(routes.dayOfWeek), asc(routes.routeOrder));
}

export async function getWeeklyReport(businessId: string, startDate: Date) {
  const start = toCalendarDate(startDate);
  const end = toCalendarDate(addDays(startDate, 6));

  const [row] = await db
    .select({
      customerCount: sql<number>`count(distinct ${collectionSchedules.customerId})::int`,
      expected: sql<string>`coalesce(sum(${collectionSchedules.expectedAmount}), 0)`,
      collected: sql<string>`coalesce(sum(${collectionSchedules.expectedAmount}) filter (where ${collectionSchedules.status} = 'paid'), 0)`,
    })
    .from(collectionSchedules)
    .innerJoin(customers, eq(collectionSchedules.customerId, customers.id))
    .where(
      and(
        eq(customers.businessId, businessId),
        between(collectionSchedules.scheduledDate, start, end),
      ),
    );

  const [outstandingRow] = await db
    .select({
      outstanding: sql<string>`coalesce(sum(${customers.outstandingAmount}), 0)`,
    })
    .from(customers)
    .where(eq(customers.businessId, businessId));

  return {
    start,
    end,
    customerCount: row?.customerCount ?? 0,
    expected: row?.expected ?? "0",
    collected: row?.collected ?? "0",
    outstanding: outstandingRow?.outstanding ?? "0",
  };
}
