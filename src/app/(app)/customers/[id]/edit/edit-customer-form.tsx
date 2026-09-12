"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoanTermFields } from "@/components/loan-term-fields";
import { getFriendlyErrorMessage } from "@/lib/utils/error-message";
import { updateCustomer } from "../../actions";

const inputClass =
  "h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong";
const labelClass = "text-sm font-medium text-foreground";

type Customer = {
  id: string;
  name: string;
  phone: string;
  alternatePhone: string | null;
  address: string | null;
  area: string | null;
  routeId: string;
  routeSequence: number;
  notes: string | null;
};

type Loan = {
  id: string;
  principalAmount: string;
  interestAmount: string;
  numberOfMonths: number | null;
  startDate: string;
};

export function EditCustomerForm({
  customerId,
  customer,
  routes,
  loan,
}: {
  customerId: string;
  customer: Customer;
  routes: { id: string; label: string }[];
  loan: Loan | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        if (loan) fd.set("loanId", loan.id);
        startTransition(async () => {
          try {
            const result = await updateCustomer(customerId, fd);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.push(`/customers/${customerId}`);
          } catch {
            setError(getFriendlyErrorMessage());
          }
        });
      }}
      className="flex flex-col gap-7"
    >
      {error && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Basic information
        </legend>
        <Field label="Full name" name="name" defaultValue={customer.name} required />
        <Field label="Mobile" name="phone" defaultValue={customer.phone} required type="tel" />
        <Field
          label="Alternative mobile"
          name="alternatePhone"
          defaultValue={customer.alternatePhone ?? ""}
          type="tel"
        />
        <Field label="Address" name="address" defaultValue={customer.address ?? ""} textarea />
        <Field label="Area" name="area" defaultValue={customer.area ?? ""} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Route
        </legend>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="routeId" className={labelClass}>
            Route
          </label>
          <select
            id="routeId"
            name="routeId"
            required
            defaultValue={customer.routeId}
            className={inputClass}
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Sequence in route (order visited)"
          name="routeSequence"
          type="number"
          defaultValue={String(customer.routeSequence)}
        />
      </fieldset>

      {loan && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Loan (current)
          </legend>
          <p className="text-xs text-muted">
            Only for correcting a mistake — this updates the total payable and monthly amount
            for months not yet paid. Already-paid months keep their original recorded amount.
          </p>
          <LoanTermFields
            defaultPrincipal={Number(loan.principalAmount)}
            defaultInterest={Number(loan.interestAmount)}
            defaultMonths={loan.numberOfMonths ?? 1}
          />
          <Field
            label="Loan start date"
            name="startDate"
            type="date"
            defaultValue={loan.startDate}
            required
          />
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Customer notes
        </legend>
        <Field label="Notes" name="notes" defaultValue={customer.notes ?? ""} textarea />
      </fieldset>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-12 flex-1 rounded-xl bg-brand-navy text-base font-medium text-white shadow-sm disabled:opacity-50 dark:bg-brand-navy-strong"
        >
          Save changes
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => router.push(`/customers/${customerId}`)}
          className="h-12 flex-1 rounded-xl border border-border text-base font-medium text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  defaultValue,
  textarea,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={2}
          defaultValue={defaultValue}
          className="rounded-xl border border-border bg-background p-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className={inputClass}
        />
      )}
    </div>
  );
}
