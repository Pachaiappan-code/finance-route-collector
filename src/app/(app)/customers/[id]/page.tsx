import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getCustomerById } from "@/lib/db/queries/customers";
import { getCustomerLoanHistory } from "@/lib/db/queries/customer-history";
import { ensureCurrentMonthCycles } from "@/lib/db/queries/ensure-cycles";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";
import { formatDisplayDate, formatMonthLabel } from "@/lib/utils/date";
import {
  AddPaymentForm,
  PaymentRowItem,
  PromiseRowItem,
  SetReminderForm,
  SplitPaymentRowItem,
} from "./payment-panel";
import { groupSplitPayments } from "./payment-grouping";
import { CloseLoanForm } from "./loan-panel";
import { DeleteCustomerButton, ToggleActiveButton } from "./delete-customer-button";
import { RatingStars } from "@/components/rating-stars";

const CYCLE_STATUS_STYLE: Record<string, string> = {
  unpaid: "bg-border/60 text-muted",
  paid: "bg-success-soft text-success",
  partial: "bg-warning-soft text-warning",
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

  const cycleMonth = currentCycleMonth();
  await ensureCurrentMonthCycles(session!.user.businessId, cycleMonth);

  const loanHistory = await getCustomerLoanHistory(id);
  const primaryLoan = loanHistory[0] ?? null;
  const currentCycleEntry = primaryLoan?.cycles.find((c) => c.cycle.cycleMonth === cycleMonth);
  const currentCycle = currentCycleEntry?.cycle;
  const remaining = currentCycle
    ? Math.max(Number(currentCycle.expectedAmount) - Number(currentCycle.paidAmount), 0)
    : 0;
  const activePromise = currentCycleEntry?.promises.find((p) => p.status === "pending");
  const totalPaid = primaryLoan
    ? primaryLoan.cycles.reduce((sum, c) => sum + Number(c.cycle.paidAmount), 0)
    : 0;
  const loanOutstanding = primaryLoan
    ? Math.max(Number(primaryLoan.loan.totalPayableAmount) - totalPaid, 0)
    : 0;
  const monthsPaid = primaryLoan
    ? primaryLoan.cycles.filter((c) => c.cycle.status === "paid").length
    : 0;
  const monthsRemaining = primaryLoan?.loan.numberOfMonths
    ? Math.max(primaryLoan.loan.numberOfMonths - monthsPaid, 0)
    : null;

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
            <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-sm text-muted">
              <Phone size={12} /> {customer.phone}
            </a>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ToggleActiveButton customerId={customer.id} isActive={customer.isActive} />
          <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
        </div>
      </div>

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

      {!primaryLoan && (
        <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          No loan on record for this customer yet.
        </p>
      )}

      {primaryLoan && (
        <>
          <section>
            <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Loan details
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Principal" value={formatCurrency(Number(primaryLoan.loan.principalAmount))} />
              <InfoCard label="Interest" value={formatCurrency(Number(primaryLoan.loan.interestAmount))} />
              <InfoCard label="Total payable" value={formatCurrency(Number(primaryLoan.loan.totalPayableAmount))} />
              <InfoCard label="Monthly amount" value={formatCurrency(Number(primaryLoan.loan.monthlyAmount))} />
              <InfoCard label="Start date" value={formatDisplayDate(primaryLoan.loan.startDate)} />
              <InfoCard
                label="Loan status"
                value={primaryLoan.loan.status === "active" ? "Active" : "Completed"}
                highlight={primaryLoan.loan.status === "completed"}
              />
              {primaryLoan.loan.numberOfMonths && (
                <>
                  <InfoCard label="Loan term" value={`${primaryLoan.loan.numberOfMonths} months`} />
                  <InfoCard label="Months remaining" value={`${monthsRemaining}`} />
                </>
              )}
            </div>
            {primaryLoan.loan.status === "active" ? (
              <CloseLoanForm
                customerId={id}
                loanId={primaryLoan.loan.id}
                computedOutstanding={loanOutstanding}
              />
            ) : (
              <Link
                href={`/customers/${id}/reloan`}
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy text-sm font-medium text-white shadow-sm dark:bg-brand-navy-strong"
              >
                <RefreshCw size={15} /> Re-loan
              </Link>
            )}
          </section>

          {currentCycle && (
            <section>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {formatMonthLabel(cycleMonth)} collection
              </h2>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">Status</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CYCLE_STATUS_STYLE[currentCycle.status]}`}
                  >
                    {currentCycle.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted">Balance</p>
                    <p className="font-medium text-danger">{formatCurrency(loanOutstanding)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Total paid</p>
                    <p className="font-medium text-success">{formatCurrency(totalPaid)}</p>
                  </div>
                </div>

                {activePromise && (
                  <div className="mt-3">
                    <PromiseRowItem
                      promise={{
                        id: activePromise.id,
                        promisedDate: activePromise.promisedDate,
                        promisedTime: activePromise.promisedTime,
                        promisedAmount: activePromise.promisedAmount,
                        status: activePromise.status,
                      }}
                    />
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {/* Add Payment always available — a customer can pay again in the
                      same month even after the cycle is already fully Paid. */}
                  <AddPaymentForm cycleId={currentCycle.id} remaining={remaining} />
                  {currentCycle.status !== "paid" && !activePromise && (
                    <SetReminderForm cycleId={currentCycle.id} remaining={remaining} />
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Loan &amp; payment history
        </h2>
        <div className="flex flex-col gap-4">
          {loanHistory.map(({ loan, cycles }, loanIndex) => (
            <div key={loan.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Loan #{loanHistory.length - loanIndex}
                  {loanIndex === 0 && (
                    <span className="ml-2 rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info">
                      Current
                    </span>
                  )}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    loan.status === "completed" ? "bg-success-soft text-success" : "bg-info-soft text-info"
                  }`}
                >
                  {loan.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatCurrency(Number(loan.principalAmount))} principal ·{" "}
                {formatCurrency(Number(loan.monthlyAmount))}/month
                {loan.numberOfMonths && (
                  <> · {cycles.filter((c) => c.cycle.status === "paid").length}/{loan.numberOfMonths} months paid</>
                )}{" "}
                · started {formatDisplayDate(loan.startDate)}
              </p>

              {loan.status === "completed" && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-success-soft px-3 py-2 text-xs">
                  <span className="text-success">
                    Closed {loan.closedAt ? formatDisplayDate(loan.closedAt) : ""} · Final
                    outstanding{" "}
                    {formatCurrency(Number(loan.finalOutstandingAmount ?? 0))}
                  </span>
                  {loan.customerRating && <RatingStars rating={loan.customerRating} />}
                </div>
              )}

              <div className="mt-3 flex flex-col gap-2.5">
                {cycles.length === 0 && (
                  <p className="text-xs text-muted">No collection cycles yet.</p>
                )}
                {cycles.map(({ cycle, payments, promises }) => (
                  <div key={cycle.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {formatMonthLabel(cycle.cycleMonth)}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CYCLE_STATUS_STYLE[cycle.status]}`}
                      >
                        {cycle.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Expected {formatCurrency(Number(cycle.expectedAmount))} · Paid{" "}
                      {formatCurrency(Number(cycle.paidAmount))}
                    </p>
                    {payments.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {groupSplitPayments(
                          payments.map((p) => ({
                            id: p.id,
                            amount: p.amount,
                            paymentDate: p.paymentDate,
                            paymentMethod: p.paymentMethod,
                            notes: p.notes,
                            clientRequestId: p.clientRequestId,
                          })),
                        ).map((group) =>
                          group.type === "split" ? (
                            <SplitPaymentRowItem
                              key={group.cash.id}
                              cash={group.cash}
                              gpay={group.gpay}
                            />
                          ) : (
                            <PaymentRowItem key={group.payment.id} payment={group.payment} />
                          ),
                        )}
                      </div>
                    )}
                    {promises.map((pr) => (
                      <div key={pr.id} className="mt-2">
                        <PromiseRowItem
                          promise={{
                            id: pr.id,
                            promisedDate: pr.promisedDate,
                            promisedTime: pr.promisedTime,
                            promisedAmount: pr.promisedAmount,
                            status: pr.status,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
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
        highlight ? "border-brand-navy/20 bg-info-soft" : "border-border bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-base font-semibold ${highlight ? "text-info" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
