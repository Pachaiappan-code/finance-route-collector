import { Download } from "lucide-react";
import { auth } from "@/lib/auth/config";
import {
  getReportDisbursements,
  getReportLoans,
  getReportPayments,
  getReportRouteBreakdown,
  getReportSummary,
} from "@/lib/db/queries/reports";
import { listActiveRoutesForSelect } from "@/lib/db/queries/customers";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";
import { formatDisplayDate } from "@/lib/utils/date";
import { RatingStars } from "@/components/rating-stars";

function firstOfCurrentMonth() {
  return currentCycleMonth();
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    route?: string;
    status?: string;
    method?: string;
  }>;
}) {
  const session = await auth();
  const businessId = session!.user.businessId;
  const sp = await searchParams;

  const from = sp.from || firstOfCurrentMonth();
  const to = sp.to || todayIso();
  const routeId = sp.route || undefined;
  const status = (sp.status as "paid" | "partial" | "unpaid" | undefined) || undefined;
  const method = (sp.method as "cash" | "gpay" | undefined) || undefined;

  const [routesList, summary, byRoute, paymentRows, loanRows, disbursementRows] = await Promise.all([
    listActiveRoutesForSelect(businessId),
    getReportSummary(businessId, from, to, { routeId, status }),
    getReportRouteBreakdown(businessId, from, to),
    getReportPayments(businessId, from, to, { routeId, paymentMethod: method }),
    getReportLoans(businessId),
    getReportDisbursements(businessId, from, to, { routeId }),
  ]);

  const totalCredited = paymentRows.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDebited = disbursementRows.reduce((sum, l) => sum + Number(l.principalAmount), 0);

  const exportParams = new URLSearchParams();
  exportParams.set("from", from);
  exportParams.set("to", to);
  if (routeId) exportParams.set("route", routeId);
  if (method) exportParams.set("method", method);

  return (
    <div className="flex flex-col gap-7 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>

      <form className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">From date</label>
            <input type="date" name="from" defaultValue={from} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">To date</label>
            <input type="date" name="to" defaultValue={to} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Route</label>
            <select name="route" defaultValue={routeId ?? ""} className={inputClass}>
              <option value="">All routes</option>
              {routesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Status</label>
            <select name="status" defaultValue={status ?? ""} className={inputClass}>
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted">Payment method</label>
          <select name="method" defaultValue={method ?? ""} className={inputClass}>
            <option value="">All methods</option>
            <option value="cash">Cash</option>
            <option value="gpay">GPay</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-11 rounded-xl bg-brand-navy text-sm font-medium text-white shadow-sm dark:bg-brand-navy-strong"
        >
          Apply filters
        </button>
      </form>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Collection summary — {formatDisplayDate(from)} to {formatDisplayDate(to)}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ReportCard label="Customers" value={String(summary.totalCustomers)} />
          <ReportCard label="Expected" value={formatCurrency(summary.expected)} />
          <ReportCard label="Collected" value={formatCurrency(summary.collected)} accent="success" />
          <ReportCard label="Pending" value={formatCurrency(summary.pending)} accent="warning" />
          <ReportCard label="Paid" value={String(summary.paidCount)} accent="success" />
          <ReportCard label="Partial" value={String(summary.partialCount)} accent="warning" />
          <ReportCard label="Unpaid" value={String(summary.unpaidCount)} accent="info" />
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Credit &amp; debit — {formatDisplayDate(from)} to {formatDisplayDate(to)}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ReportCard label="Credited (received)" value={formatCurrency(totalCredited)} accent="success" />
          <ReportCard label="Debited (loans given)" value={formatCurrency(totalDebited)} accent="danger" />
        </div>
        <div className="mt-2 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Net (credit − debit)</p>
          <p
            className={`mt-0.5 text-lg font-semibold ${
              totalCredited - totalDebited >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatCurrency(totalCredited - totalDebited)}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          By route
        </h2>
        <div className="flex flex-col gap-2">
          {byRoute.map((r) => (
            <div
              key={r.routeId}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{r.routeName}</p>
                <p className="text-xs text-muted">
                  {r.customerCount} customers · {r.paidCount} paid · {r.partialCount} partial ·{" "}
                  {r.unpaidCount} unpaid
                </p>
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
          Payments received — Credit ({paymentRows.length})
        </h2>
        <div className="flex flex-col gap-2">
          {paymentRows.length === 0 && (
            <p className="text-sm text-muted">No payments in this range.</p>
          )}
          {paymentRows.slice(0, 50).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{p.customerName}</p>
                <p className="text-xs text-muted">
                  {p.routeName ?? "—"} · {formatDisplayDate(p.paymentDate)} ·{" "}
                  <span className="capitalize">{p.paymentMethod}</span>
                  {p.notes ? ` · ${p.notes}` : ""}
                </p>
              </div>
              <p className="font-semibold text-success">+{formatCurrency(Number(p.amount))}</p>
            </div>
          ))}
          {paymentRows.length > 50 && (
            <p className="text-xs text-muted">
              Showing the first 50 of {paymentRows.length} — use CSV export for the full list.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Loans given — Debit ({disbursementRows.length})
        </h2>
        <div className="flex flex-col gap-2">
          {disbursementRows.length === 0 && (
            <p className="text-sm text-muted">No loans given in this range.</p>
          )}
          {disbursementRows.slice(0, 50).map((l) => (
            <div
              key={l.loanId}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{l.customerName}</p>
                <p className="text-xs text-muted">
                  {l.routeName ?? "—"} · {formatDisplayDate(l.startDate)}
                  {l.numberOfMonths && <> · {l.numberOfMonths} months</>}
                </p>
              </div>
              <p className="font-semibold text-danger">−{formatCurrency(Number(l.principalAmount))}</p>
            </div>
          ))}
          {disbursementRows.length > 50 && (
            <p className="text-xs text-muted">
              Showing the first 50 of {disbursementRows.length} — use CSV export for the full list.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Loans ({loanRows.length})
        </h2>
        <div className="flex flex-col gap-2">
          {loanRows.slice(0, 30).map((l) => {
            const balance = Math.max(
              Number(l.totalPayableAmount) - Number(l.collected),
              0,
            );
            return (
              <div
                key={l.loanId}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{l.customerName}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    Started {formatDisplayDate(l.startDate)} ·{" "}
                    <span className="capitalize">{l.status}</span>
                    {l.numberOfMonths && <>· {l.monthsPaid}/{l.numberOfMonths} months</>}
                    {l.customerRating && <RatingStars rating={l.customerRating} />}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(Number(l.collected))} / {formatCurrency(Number(l.totalPayableAmount))}
                  </p>
                  {balance > 0 && (
                    <p className="text-xs text-danger">Balance {formatCurrency(balance)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Export
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["Customers", "/api/export/customers"],
            ["Payments", `/api/export/payments?${exportParams.toString()}`],
            ["Loans given", `/api/export/loans-given?${exportParams.toString()}`],
            ["Collections", "/api/export/collections"],
            ["Due", "/api/export/due"],
          ].map(([label, href]) => (
            <a
              key={label}
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
  accent?: "success" | "warning" | "info" | "danger";
}) {
  const accentClass = accent
    ? { success: "text-success", warning: "text-warning", info: "text-info", danger: "text-danger" }[accent]
    : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}
