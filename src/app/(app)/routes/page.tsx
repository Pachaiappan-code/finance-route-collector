import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listRoutesWithCounts } from "@/lib/db/queries/routes";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { toggleRouteActive } from "./actions";

export default async function RoutesPage() {
  const session = await auth();
  const routes = await listRoutesWithCounts(session!.user.businessId);

  const byDay = new Map<number, typeof routes>();
  for (const route of routes) {
    const list = byDay.get(route.dayOfWeek) ?? [];
    list.push(route);
    byDay.set(route.dayOfWeek, list);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Routes</h1>
        <Link
          href="/routes/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          + New route
        </Link>
      </div>

      {routes.length === 0 && (
        <p className="text-sm text-zinc-500">
          No routes yet. Create your first route to start adding customers.
        </p>
      )}

      {Array.from(byDay.entries())
        .sort(([a], [b]) => a - b)
        .map(([dayOfWeek, dayRoutes]) => (
          <div key={dayOfWeek} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-zinc-500">
              {dayOfWeekName(dayOfWeek)}
            </h2>
            {dayRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Link href={`/routes/${route.id}`} className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {route.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {route.customerCount} customer{route.customerCount === 1 ? "" : "s"}
                    {!route.isActive && " · Inactive"}
                  </p>
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await toggleRouteActive(route.id, !route.isActive);
                  }}
                >
                  <button className="text-xs font-medium text-zinc-500">
                    {route.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
