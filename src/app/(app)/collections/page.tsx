import Link from "next/link";
import { MapPin } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getRouteMonthSummaries } from "@/lib/db/queries/cycles";
import { ensureCurrentMonthCycles } from "@/lib/db/queries/ensure-cycles";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatMonthLabel } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/format";

export default async function RoutesCollectionPage() {
  const session = await auth();
  const businessId = session!.user.businessId;
  const cycleMonth = currentCycleMonth();

  await ensureCurrentMonthCycles(businessId, cycleMonth);
  const routes = await getRouteMonthSummaries(businessId, cycleMonth);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          Routes
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {formatMonthLabel(cycleMonth)}
        </h1>
      </div>

      {routes.length === 0 && (
        <p className="text-sm text-muted">No routes configured yet.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {routes.map((r) => {
          const expected = Number(r.expected);
          const collected = Number(r.collected);
          const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;
          return (
            <Link
              key={r.routeId}
              href={`/collections/${r.routeId}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-navy/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{r.routeName}</p>
                <p className="text-xs text-muted">
                  {r.customerCount} customers · {r.paidCount} paid · {r.partialCount} partial ·{" "}
                  {r.unpaidCount} unpaid
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-brand-green"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <p className="font-semibold text-foreground">{formatCurrency(expected)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
