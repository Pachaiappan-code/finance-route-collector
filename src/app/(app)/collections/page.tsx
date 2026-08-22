import Link from "next/link";
import { MapPin } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getTodaysRoutesSummary } from "@/lib/db/queries/collections";
import { getDayOfWeek, dayOfWeekName, toCalendarDate } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";

export default async function TodaysRoutesPage() {
  const session = await auth();
  const today = new Date();
  const dateStr = toCalendarDate(today);
  const dayOfWeek = getDayOfWeek(today);

  const routes = await getTodaysRoutesSummary(session!.user.businessId, dayOfWeek, dateStr);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          {dayOfWeekName(dayOfWeek)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Today&apos;s routes
        </h1>
      </div>

      {routes.length === 0 && (
        <p className="text-sm text-muted">No active routes scheduled for today.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {routes.map((r) => {
          const pct =
            r.customerCount > 0 ? Math.round((r.paidCount / r.customerCount) * 100) : 0;
          return (
            <Link
              key={r.id}
              href={`/collections/${r.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-navy/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted">
                  {r.paidCount}/{r.customerCount} collected
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-brand-green"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <p className="font-semibold text-foreground">
                {formatCurrency(Number(r.expectedAmount))}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
