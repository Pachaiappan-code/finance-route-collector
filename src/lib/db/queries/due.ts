import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionSchedules, customers, paymentPromises, routes } from "@/lib/db/schema";

export async function listDueCustomers(businessId: string) {
  const rows = await db
    .select({
      scheduleId: collectionSchedules.id,
      scheduledDate: collectionSchedules.scheduledDate,
      status: collectionSchedules.status,
      expectedAmount: collectionSchedules.expectedAmount,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      routeName: routes.name,
    })
    .from(collectionSchedules)
    .innerJoin(customers, eq(collectionSchedules.customerId, customers.id))
    .innerJoin(routes, eq(collectionSchedules.routeId, routes.id))
    .where(
      and(
        eq(customers.businessId, businessId),
        inArray(collectionSchedules.status, ["due", "partial", "overdue", "pending"]),
      ),
    )
    .orderBy(asc(collectionSchedules.scheduledDate));

  const scheduleIds = rows.map((r) => r.scheduleId);
  const promises = scheduleIds.length
    ? await db
        .select()
        .from(paymentPromises)
        .where(
          and(
            inArray(paymentPromises.collectionScheduleId, scheduleIds),
            eq(paymentPromises.status, "pending"),
          ),
        )
    : [];

  const promiseBySchedule = new Map(promises.map((p) => [p.collectionScheduleId, p]));

  const today = new Date().toISOString().slice(0, 10);

  return rows
    .filter((r) => r.status !== "pending" || r.scheduledDate < today)
    .map((r) => ({
      ...r,
      promise: promiseBySchedule.get(r.scheduleId) ?? null,
      overdueDays: Math.max(
        0,
        Math.floor(
          (new Date(today).getTime() - new Date(r.scheduledDate).getTime()) /
            86_400_000,
        ),
      ),
    }))
    .sort((a, b) => b.overdueDays - a.overdueDays);
}
