import Link from "next/link";
import { Route as RouteIcon } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getRouteMonthSummaries } from "@/lib/db/queries/cycles";
import { ensureCurrentMonthCycles } from "@/lib/db/queries/ensure-cycles";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatMonthLabel } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/format";
import { toggleRouteActive } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export default async function RoutesPage() {
  const session = await auth();
  const businessId = session!.user.businessId;
  const cycleMonth = currentCycleMonth();

  await ensureCurrentMonthCycles(businessId, cycleMonth);
  const routes = await getRouteMonthSummaries(businessId, cycleMonth);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Routes</h1>
        <p className="text-sm text-muted">{formatMonthLabel(cycleMonth)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {routes.map((route) => {
          const expected = Number(route.expected);
          const collected = Number(route.collected);
          return (
            <div
              key={route.routeId}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
                  <RouteIcon size={17} />
                </div>
                <Link href={`/collections/${route.routeId}`} className="flex-1">
                  <p className="font-medium text-foreground">{route.routeName}</p>
                  <p className="text-xs text-muted">{route.customerCount} customers</p>
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await toggleRouteActive(route.routeId, false);
                  }}
                >
                  <SubmitButton pendingLabel="..." className="text-xs font-medium text-muted disabled:opacity-50">
                    Deactivate
                  </SubmitButton>
                </form>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-success-soft py-2">
                  <p className="font-semibold text-success">{route.paidCount}</p>
                  <p className="text-success/80">Paid</p>
                </div>
                <div className="rounded-xl bg-warning-soft py-2">
                  <p className="font-semibold text-warning">{route.partialCount}</p>
                  <p className="text-warning/80">Partial</p>
                </div>
                <div className="rounded-xl bg-danger-soft py-2">
                  <p className="font-semibold text-danger">{route.unpaidCount}</p>
                  <p className="text-danger/80">Unpaid</p>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>Expected {formatCurrency(expected)}</span>
                <span>Collected {formatCurrency(collected)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
