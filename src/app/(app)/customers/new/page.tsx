import { auth } from "@/lib/auth/config";
import { listActiveRoutesForSelect } from "@/lib/db/queries/customers";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { LoanTermFields } from "@/components/loan-term-fields";
import { createCustomer } from "../actions";

const inputClass =
  "h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong";
const labelClass = "text-sm font-medium text-foreground";

export default async function NewCustomerPage() {
  const session = await auth();
  const routes = await listActiveRoutesForSelect(session!.user.businessId);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New customer
      </h1>

      {routes.length === 0 && (
        <p className="rounded-xl bg-warning-soft px-3.5 py-2.5 text-sm font-medium text-warning">
          Create a route first before adding customers.
        </p>
      )}

      <form action={createCustomer} className="flex flex-col gap-7">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Basic information
          </legend>
          <Field label="Full name" name="name" required />
          <Field label="Mobile" name="phone" required type="tel" />
          <Field label="Alternative mobile" name="alternatePhone" type="tel" />
          <Field label="Address" name="address" textarea />
          <Field label="Area" name="area" />
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
              disabled={routes.length === 0}
              className={inputClass}
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {dayOfWeekName(r.dayOfWeek)} · {r.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="Sequence in route (order visited)" name="routeSequence" type="number" defaultValue="0" />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Loan
          </legend>
          <LoanTermFields />
          <Field label="Loan start date" name="startDate" type="date" defaultValue={today} required />
          <Field label="Loan notes (optional)" name="loanNotes" textarea />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Customer notes
          </legend>
          <Field label="Notes" name="notes" textarea />
        </fieldset>

        <button
          type="submit"
          disabled={routes.length === 0}
          className="h-12 rounded-xl bg-brand-navy text-base font-medium text-white shadow-sm disabled:opacity-40 dark:bg-brand-navy-strong"
        >
          Save customer
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  step,
  defaultValue,
  textarea,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  step?: string;
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
          step={step}
          required={required}
          defaultValue={defaultValue}
          className={inputClass}
        />
      )}
    </div>
  );
}
