import Link from "next/link";
import { Plus, Route as RouteIcon } from "lucide-react";
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
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Routes</h1>
        <Link
          href="/routes/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm dark:bg-brand-navy-strong"
        >
          <Plus size={15} /> New route
        </Link>
      </div>

      {routes.length === 0 && (
        <p className="text-sm text-muted">
          No routes yet. Create your first route to start adding customers.
        </p>
      )}

      {Array.from(byDay.entries())
        .sort(([a], [b]) => a - b)
        .map(([dayOfWeek, dayRoutes]) => (
          <div key={dayOfWeek} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">
              {dayOfWeekName(dayOfWeek)}
            </h2>
            {dayRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
                  <RouteIcon size={17} />
                </div>
                <Link href={`/routes/${route.id}`} className="flex-1">
                  <p className="font-medium text-foreground">
                    {route.name}
                  </p>
                  <p className="text-xs text-muted">
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
                  <button className="text-xs font-medium text-muted">
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
