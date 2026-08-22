import { Download } from "lucide-react";
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
    <div className="flex flex-col gap-7 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Daily — {daily.date}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ReportCard label="Expected" value={formatCurrency(daily.expectedAmount)} />
          <ReportCard label="Collected" value={formatCurrency(daily.collectedAmount)} accent="success" />
          <ReportCard label="Pending" value={formatCurrency(daily.pendingAmount)} accent="warning" />
          <ReportCard label="Collection %" value={`${collectionPct}%`} accent="info" />
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          This week ({weekly.start} to {weekly.end})
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ReportCard label="Customers" value={String(weekly.customerCount)} />
          <ReportCard label="Expected" value={formatCurrency(Number(weekly.expected))} />
          <ReportCard label="Collected" value={formatCurrency(Number(weekly.collected))} accent="success" />
          <ReportCard label="Outstanding" value={formatCurrency(Number(weekly.outstanding))} accent="warning" />
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          By route — today
        </h2>
        <div className="flex flex-col gap-2">
          {byRoute.map((r) => (
            <div
              key={r.routeId}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {r.routeName}
                </p>
                <p className="text-xs text-muted">{r.customerCount} customers</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(Number(r.collected))} / {formatCurrency(Number(r.expected))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Export
        </h2>
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
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground"
            >
              <Download size={14} /> {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "warning" | "info";
}) {
  const accentClass = accent
    ? { success: "text-success", warning: "text-warning", info: "text-info" }[accent]
    : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}
