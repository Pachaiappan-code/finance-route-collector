import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionCycles, customers, paymentPromises, routes } from "@/lib/db/schema";

/** Follow-up list: every customer whose CURRENT month cycle is partial or unpaid, across all routes. */
export async function listDueCustomers(businessId: string, cycleMonth: string) {
  const rows = await db
    .select({
      cycleId: collectionCycles.id,
      cycleMonth: collectionCycles.cycleMonth,
      status: collectionCycles.status,
      expectedAmount: collectionCycles.expectedAmount,
      paidAmount: collectionCycles.paidAmount,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      routeName: routes.name,
    })
    .from(collectionCycles)
    .innerJoin(customers, eq(collectionCycles.customerId, customers.id))
    .innerJoin(routes, eq(collectionCycles.routeId, routes.id))
    .where(
      and(
        eq(customers.businessId, businessId),
        eq(collectionCycles.cycleMonth, cycleMonth),
        inArray(collectionCycles.status, ["partial", "unpaid"]),
      ),
    )
    .orderBy(asc(customers.name));

  const cycleIds = rows.map((r) => r.cycleId);
  const promises = cycleIds.length
    ? await db
        .select()
        .from(paymentPromises)
        .where(
          and(
            inArray(paymentPromises.collectionCycleId, cycleIds),
            eq(paymentPromises.status, "pending"),
          ),
        )
    : [];

  const promiseByCycle = new Map(
    promises.filter((p) => p.collectionCycleId).map((p) => [p.collectionCycleId as string, p]),
  );

  return rows
    .map((r) => ({
      ...r,
      remaining: Math.max(Number(r.expectedAmount) - Number(r.paidAmount), 0),
      promise: promiseByCycle.get(r.cycleId) ?? null,
    }))
    .sort((a, b) => b.remaining - a.remaining);
}
