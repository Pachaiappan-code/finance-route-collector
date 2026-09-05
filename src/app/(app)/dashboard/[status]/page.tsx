import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Route as RouteIcon } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getRouteMonthSummaries } from "@/lib/db/queries/cycles";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatMonthLabel } from "@/lib/utils/date";
import type { CycleStatus } from "@/lib/db/queries/cycles";

const STATUS_META: Record<CycleStatus, { label: string; tone: string }> = {
  paid: { label: "Paid", tone: "text-success" },
  partial: { label: "Partial", tone: "text-warning" },
  unpaid: { label: "Unpaid", tone: "text-danger" },
};

export default async function DashboardStatusRoutesPage({
  params,
}: {
  params: Promise<{ status: string }>;
}) {
  const { status } = await params;
  if (status !== "paid" && status !== "partial" && status !== "unpaid") notFound();

  const session = await auth();
  const cycleMonth = currentCycleMonth();
  const routes = await getRouteMonthSummaries(session!.user.businessId, cycleMonth);
  const meta = STATUS_META[status];
  const countKey =
    status === "paid" ? "paidCount" : status === "partial" ? "partialCount" : "unpaidCount";

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <p className={`text-sm font-medium ${meta.tone}`}>{meta.label} customers</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Choose a route
        </h1>
        <p className="text-sm text-muted">{formatMonthLabel(cycleMonth)}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {routes.map((r) => (
          <Link
            key={r.routeId}
            href={`/dashboard/${status}/${r.routeId}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-navy/30"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
              <RouteIcon size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{r.routeName}</p>
              <p className="text-xs text-muted">{r.customerCount} customers this month</p>
            </div>
            <p className={`text-lg font-semibold ${meta.tone}`}>{r[countKey]}</p>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
