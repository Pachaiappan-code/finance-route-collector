import { auth } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/db/queries/dashboard";
import { getRouteReport, getWeeklyReport } from "@/lib/db/queries/reports";
import { formatCurrency } from "@/lib/utils/format";

export default async function ReportsPage() {
  const session = await auth();
  const businessId = session!.user.businessId;
  const today = new Date();

  const [daily, byRoute, weekly] = await Promise.all([
    getDashboardData(businessId, today),
    getRouteReport(businessId, today.toISOString().slice(0, 10)),
    getWeeklyReport(businessId, today),
  ]);

  const collectionPct =
    daily.expectedAmount > 0
      ? Math.round((daily.collectedAmount / daily.expectedAmount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Reports</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">Daily — {daily.date}</h2>
        <div className="grid grid-cols-2 gap-3">
          <ReportCard label="Expected" value={formatCurrency(daily.expectedAmount)} />
          <ReportCard label="Collected" value={formatCurrency(daily.collectedAmount)} />
          <ReportCard label="Pending" value={formatCurrency(daily.pendingAmount)} />
          <ReportCard label="Collection %" value={`${collectionPct}%`} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          This week ({weekly.start} to {weekly.end})
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ReportCard label="Customers" value={String(weekly.customerCount)} />
          <ReportCard label="Expected" value={formatCurrency(Number(weekly.expected))} />
          <ReportCard label="Collected" value={formatCurrency(Number(weekly.collected))} />
          <ReportCard label="Outstanding" value={formatCurrency(Number(weekly.outstanding))} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">By route — today</h2>
        <div className="flex flex-col gap-2">
          {byRoute.map((r) => (
            <div
              key={r.routeId}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {r.routeName}
                </p>
                <p className="text-xs text-zinc-500">{r.customerCount} customers</p>
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(Number(r.collected))} / {formatCurrency(Number(r.expected))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">Export</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["Customers", "/api/export/customers"],
            ["Payments", "/api/export/payments"],
            ["Collections", "/api/export/collections"],
            ["Due", "/api/export/due"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
            >
              {label} CSV
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
