import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, routes } from "@/lib/db/schema";

export async function listRoutesWithCounts(businessId: string) {
  return db
    .select({
      id: routes.id,
      name: routes.name,
      dayOfWeek: routes.dayOfWeek,
      routeOrder: routes.routeOrder,
      description: routes.description,
      isActive: routes.isActive,
      customerCount: sql<number>`count(${customers.id}) filter (where ${customers.isActive} = true)::int`,
    })
    .from(routes)
    .leftJoin(customers, eq(customers.routeId, routes.id))
    .where(eq(routes.businessId, businessId))
    .groupBy(routes.id)
    .orderBy(asc(routes.dayOfWeek), asc(routes.routeOrder), asc(routes.name));
}

export async function getRouteById(businessId: string, routeId: string) {
  const [route] = await db
    .select()
    .from(routes)
    .where(and(eq(routes.businessId, businessId), eq(routes.id, routeId)))
    .limit(1);
  return route ?? null;
}
