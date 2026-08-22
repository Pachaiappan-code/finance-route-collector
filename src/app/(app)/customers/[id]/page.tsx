import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getCustomerById } from "@/lib/db/queries/customers";
import { getCustomerHistory } from "@/lib/db/queries/customer-history";
import { formatCurrency } from "@/lib/utils/format";
import { toggleCustomerActive } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  partial: "Partial",
  due: "Due",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  overdue: "Overdue",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-border/60 text-muted",
  paid: "bg-success-soft text-success",
  partial: "bg-warning-soft text-warning",
  due: "bg-danger-soft text-danger",
  rescheduled: "bg-info-soft text-info",
  cancelled: "bg-border/60 text-muted",
  overdue: "bg-danger-soft text-danger",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const customer = await getCustomerById(session!.user.businessId, id);
  if (!customer) notFound();

  const history = await getCustomerHistory(id);

  return (
    <div className="flex flex-col gap-6 p-4 pt-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-info-soft text-base font-semibold text-info">
            {initials(customer.name)}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {customer.name}
            </h1>
            <p className="text-sm text-muted">
              {customer.customerCode} · {customer.routeName}
            </p>
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-sm text-muted"
            >
              <Phone size={12} /> {customer.phone}
            </a>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await toggleCustomerActive(customer.id, !customer.isActive);
          }}
        >
          <button className="text-xs font-medium text-muted">
            {customer.isActive ? "Deactivate" : "Activate"}
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <InfoCard label="Principal" value={formatCurrency(Number(customer.principalAmount))} />
        <InfoCard label="Interest" value={formatCurrency(Number(customer.interestAmount))} />
        <InfoCard label="Total repayment" value={formatCurrency(Number(customer.totalRepaymentAmount))} />
        <InfoCard label="Outstanding" value={formatCurrency(Number(customer.outstandingAmount))} highlight />
        <InfoCard label="Per-cycle collection" value={formatCurrency(Number(customer.collectionAmount))} />
        <InfoCard label="Cycle" value={`${customer.cycleDays} days`} />
      </section>

      {customer.address && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-muted">Address</h2>
          <p className="text-sm text-foreground">{customer.address}</p>
        </section>
      )}

      {customer.notes && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-muted">Notes</h2>
          <p className="text-sm text-foreground">{customer.notes}</p>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">History</h2>
        <div className="flex flex-col gap-2">
          {history.length === 0 && (
            <p className="text-sm text-muted">No collection history yet.</p>
          )}
          {history.map(({ schedule, payments, promises }) => (
            <div
              key={schedule.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">
                  {schedule.scheduledDate}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[schedule.status]}`}
                >
                  {STATUS_LABEL[schedule.status]}
                </span>
              </div>
              <p className="text-sm text-muted">
                Expected {formatCurrency(Number(schedule.expectedAmount))} · Cycle #{schedule.cycleNumber}
              </p>
              {payments.map((p) => (
                <p key={p.id} className="mt-1 text-sm font-medium text-success">
                  Paid {formatCurrency(Number(p.amount))} on {p.paymentDate} ({p.paymentMethod})
                </p>
              ))}
              {promises.map((pr) => (
                <p key={pr.id} className="mt-1 text-sm font-medium text-warning">
                  Promised {pr.promisedDate} {pr.promisedTime ?? ""}
                  {pr.promisedAmount ? ` · ${formatCurrency(Number(pr.promisedAmount))}` : ""}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        highlight
          ? "border-brand-navy/20 bg-info-soft"
          : "border-border bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold ${highlight ? "text-info" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
