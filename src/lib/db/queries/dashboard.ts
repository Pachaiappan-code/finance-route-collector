import { and, eq, lt, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionSchedules, routes } from "@/lib/db/schema";
import { getDayOfWeek } from "@/lib/calculations/cycle";

export type DashboardData = {
  date: string;
  dayOfWeek: number;
  todaysRouteCount: number;
  totalCustomers: number;
  expectedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  paidCount: number;
  dueCount: number;
  partialCount: number;
  overdueCount: number;
};

export async function getDashboardData(
  businessId: string,
  today: Date,
): Promise<DashboardData> {
  const dateStr = today.toISOString().slice(0, 10);
  const dayOfWeek = getDayOfWeek(today);

  const [routeCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(routes)
    .where(
      and(
        eq(routes.businessId, businessId),
        eq(routes.dayOfWeek, dayOfWeek),
        eq(routes.isActive, true),
      ),
    );

  const todaysSchedules = await db
    .select({
      status: collectionSchedules.status,
      expectedAmount: collectionSchedules.expectedAmount,
    })
    .from(collectionSchedules)
    .innerJoin(routes, eq(collectionSchedules.routeId, routes.id))
    .where(
      and(
        eq(routes.businessId, businessId),
        eq(collectionSchedules.scheduledDate, dateStr),
      ),
    );

  const [overdueRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(collectionSchedules)
    .innerJoin(routes, eq(collectionSchedules.routeId, routes.id))
    .where(
      and(
        eq(routes.businessId, businessId),
        lt(collectionSchedules.scheduledDate, dateStr),
        ne(collectionSchedules.status, "paid"),
        ne(collectionSchedules.status, "cancelled"),
      ),
    );

  let expectedAmount = 0;
  let collectedAmount = 0;
  let paidCount = 0;
  let dueCount = 0;
  let partialCount = 0;

  for (const row of todaysSchedules) {
    const amount = Number(row.expectedAmount);
    expectedAmount += amount;
    if (row.status === "paid") {
      collectedAmount += amount;
      paidCount += 1;
    } else if (row.status === "due" || row.status === "pending") {
      dueCount += 1;
    } else if (row.status === "partial") {
      partialCount += 1;
    }
  }

  return {
    date: dateStr,
    dayOfWeek,
    todaysRouteCount: routeCountRow?.count ?? 0,
    totalCustomers: todaysSchedules.length,
    expectedAmount,
    collectedAmount,
    pendingAmount: Math.max(expectedAmount - collectedAmount, 0),
    paidCount,
    dueCount,
    partialCount,
    overdueCount: overdueRow?.count ?? 0,
  };
}
