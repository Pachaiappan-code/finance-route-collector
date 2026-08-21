import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
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
    .select()
    .from(customers)
    .where(and(eq(customers.routeId, id), eq(customers.isActive, true)))
    .orderBy(customers.routeSequence);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-sm text-zinc-500">{dayOfWeekName(route.dayOfWeek)}</p>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {route.name}
        </h1>
        {route.description && (
          <p className="mt-1 text-sm text-zinc-500">{route.description}</p>
        )}
      </div>

      <Link
        href={`/collections/${route.id}`}
        className="h-12 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900"
      >
        Start today&apos;s collection
      </Link>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          Customers ({routeCustomers.length})
        </h2>
        <div className="flex flex-col gap-2">
          {routeCustomers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</p>
                <p className="text-xs text-zinc-500">{c.customerCode} · {c.phone}</p>
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(Number(c.outstandingAmount))}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
