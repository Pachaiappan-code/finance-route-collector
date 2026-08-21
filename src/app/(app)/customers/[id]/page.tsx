import { notFound } from "next/navigation";
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
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {customer.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {customer.customerCode} · {customer.routeName}
          </p>
          <p className="text-sm text-zinc-500">{customer.phone}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await toggleCustomerActive(customer.id, !customer.isActive);
          }}
        >
          <button className="text-xs font-medium text-zinc-500">
            {customer.isActive ? "Deactivate" : "Activate"}
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <InfoCard label="Principal" value={formatCurrency(Number(customer.principalAmount))} />
        <InfoCard label="Interest" value={formatCurrency(Number(customer.interestAmount))} />
        <InfoCard label="Total repayment" value={formatCurrency(Number(customer.totalRepaymentAmount))} />
        <InfoCard label="Outstanding" value={formatCurrency(Number(customer.outstandingAmount))} />
        <InfoCard label="Per-cycle collection" value={formatCurrency(Number(customer.collectionAmount))} />
        <InfoCard label="Cycle" value={`${customer.cycleDays} days`} />
      </section>

      {customer.address && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-zinc-500">Address</h2>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">{customer.address}</p>
        </section>
      )}

      {customer.notes && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-zinc-500">Notes</h2>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">{customer.notes}</p>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">History</h2>
        <div className="flex flex-col gap-2">
          {history.length === 0 && (
            <p className="text-sm text-zinc-500">No collection history yet.</p>
          )}
          {history.map(({ schedule, payments, promises }) => (
            <div
              key={schedule.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {schedule.scheduledDate}
                </p>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {STATUS_LABEL[schedule.status]}
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                Expected {formatCurrency(Number(schedule.expectedAmount))} · Cycle #{schedule.cycleNumber}
              </p>
              {payments.map((p) => (
                <p key={p.id} className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                  Paid {formatCurrency(Number(p.amount))} on {p.paymentDate} ({p.paymentMethod})
                </p>
              ))}
              {promises.map((pr) => (
                <p key={pr.id} className="mt-1 text-sm text-amber-700 dark:text-amber-400">
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
