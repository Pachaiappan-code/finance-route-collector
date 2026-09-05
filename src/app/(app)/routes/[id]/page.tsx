import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { PlayCircle } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { getRouteById } from "@/lib/db/queries/routes";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const route = await getRouteById(session!.user.businessId, id);
  if (!route) notFound();

  const routeCustomers = await db
    .select({
      id: customers.id,
      name: customers.name,
      customerCode: customers.customerCode,
      phone: customers.phone,
      outstandingAmount: sql<string>`coalesce((
        select sum(l.total_payable_amount - coalesce((
          select sum(cc.paid_amount) from collection_cycles cc where cc.loan_id = l.id
        ), 0))
        from loans l
        where l.customer_id = ${customers.id} and l.status = 'active'
      ), 0)`,
    })
    .from(customers)
    .where(and(eq(customers.routeId, id), eq(customers.isActive, true)))
    .orderBy(customers.routeSequence);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          {dayOfWeekName(route.dayOfWeek)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {route.name}
        </h1>
        {route.description && (
          <p className="mt-1 text-sm text-muted">{route.description}</p>
        )}
      </div>

      <Link
        href={`/collections/${route.id}`}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 text-base font-medium text-white shadow-sm dark:bg-brand-navy-strong"
      >
        <PlayCircle size={18} /> Start today&apos;s collection
      </Link>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">
          Customers ({routeCustomers.length})
        </h2>
        <div className="flex flex-col gap-2">
          {routeCustomers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted">{c.customerCode} · {c.phone}</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(Number(c.outstandingAmount))}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
