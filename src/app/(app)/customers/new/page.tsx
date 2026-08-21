import { auth } from "@/lib/auth/config";
import { listActiveRoutesForSelect } from "@/lib/db/queries/customers";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { createCustomer } from "../actions";

export default async function NewCustomerPage() {
  const session = await auth();
  const routes = await listActiveRoutesForSelect(session!.user.businessId);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New customer
      </h1>

      {routes.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Create a route first before adding customers.
        </p>
      )}

      <form action={createCustomer} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-zinc-500">Basic information</legend>
          <Field label="Full name" name="name" required />
          <Field label="Mobile" name="phone" required type="tel" />
          <Field label="Alternative mobile" name="alternatePhone" type="tel" />
          <Field label="Address" name="address" textarea />
          <Field label="Area" name="area" />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-zinc-500">Route</legend>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="routeId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Route
            </label>
            <select
              id="routeId"
              name="routeId"
              required
              disabled={routes.length === 0}
              className="h-12 rounded-lg border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
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
          <legend className="mb-1 text-sm font-medium text-zinc-500">Finance</legend>
          <Field label="Principal amount" name="principalAmount" type="number" step="0.01" defaultValue="0" />
          <Field label="Interest amount" name="interestAmount" type="number" step="0.01" defaultValue="0" />
          <Field label="Total repayment amount" name="totalRepaymentAmount" type="number" step="0.01" defaultValue="0" />
          <Field label="Expected collection per cycle" name="collectionAmount" type="number" step="0.01" required />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-zinc-500">Cycle</legend>
          <Field label="Cycle length (days)" name="cycleDays" type="number" defaultValue="7" required />
          <Field label="Start date" name="startDate" type="date" defaultValue={today} required />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-zinc-500">Notes</legend>
          <Field label="Notes" name="notes" textarea />
        </fieldset>

        <button
          type="submit"
          disabled={routes.length === 0}
          className="h-12 rounded-lg bg-zinc-900 text-base font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
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
      <label htmlFor={name} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={2}
          defaultValue={defaultValue}
          className="rounded-lg border border-zinc-300 p-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          step={step}
          required={required}
          defaultValue={defaultValue}
          className="h-12 rounded-lg border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}
    </div>
  );
}
