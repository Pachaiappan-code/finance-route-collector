import Link from "next/link";
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
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-sm text-zinc-500">{dayOfWeekName(dayOfWeek)}</p>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Today&apos;s routes
        </h1>
      </div>

      {routes.length === 0 && (
        <p className="text-sm text-zinc-500">No active routes scheduled for today.</p>
      )}

      <div className="flex flex-col gap-2">
        {routes.map((r) => (
          <Link
            key={r.id}
            href={`/collections/${r.id}`}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{r.name}</p>
              <p className="text-xs text-zinc-500">
                {r.paidCount}/{r.customerCount} collected
              </p>
            </div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(Number(r.expectedAmount))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
