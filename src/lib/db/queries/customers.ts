import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, routes } from "@/lib/db/schema";

export async function listCustomers(businessId: string, search?: string) {
  const conditions = [eq(customers.businessId, businessId)];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(customers.name, term),
        ilike(customers.phone, term),
        ilike(customers.customerCode, term),
        ilike(customers.area, term),
      )!,
    );
  }

  return db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
      phone: customers.phone,
      area: customers.area,
      isActive: customers.isActive,
      routeName: routes.name,
      // Outstanding = active loans' total payable minus everything ever paid against them.
      // The inner cycle-paid subquery is correlated per-loan (not joined) so a loan with
      // several monthly cycles doesn't get its total_payable_amount counted more than once.
      outstandingAmount: sql<string>`coalesce((
        select sum(l.total_payable_amount - coalesce((
          select sum(cc.paid_amount) from collection_cycles cc where cc.loan_id = l.id
        ), 0))
        from loans l
        where l.customer_id = ${customers.id} and l.status = 'active'
      ), 0)`,
    })
    .from(customers)
    .innerJoin(routes, eq(customers.routeId, routes.id))
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt));
}

export async function getCustomerById(businessId: string, customerId: string) {
  const [customer] = await db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
      phone: customers.phone,
      alternatePhone: customers.alternatePhone,
      address: customers.address,
      area: customers.area,
      routeId: customers.routeId,
      routeName: routes.name,
      routeSequence: customers.routeSequence,
      isActive: customers.isActive,
      notes: customers.notes,
    })
    .from(customers)
    .innerJoin(routes, eq(customers.routeId, routes.id))
    .where(and(eq(customers.businessId, businessId), eq(customers.id, customerId)))
    .limit(1);

  return customer ?? null;
}

export async function nextCustomerCode(businessId: string): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(eq(customers.businessId, businessId));

  const sequence = (row?.count ?? 0) + 1;
  return `CUS-${String(sequence).padStart(4, "0")}`;
}

export async function listActiveRoutesForSelect(businessId: string) {
  return db
    .select({ id: routes.id, name: routes.name, dayOfWeek: routes.dayOfWeek })
    .from(routes)
    .where(and(eq(routes.businessId, businessId), eq(routes.isActive, true)))
    .orderBy(asc(routes.dayOfWeek), asc(routes.routeOrder));
}
