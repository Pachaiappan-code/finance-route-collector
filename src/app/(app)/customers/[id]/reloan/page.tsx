import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getCustomerById } from "@/lib/db/queries/customers";
import { LoanTermFields } from "@/components/loan-term-fields";
import { SubmitButton } from "@/components/submit-button";
import { createReLoan } from "../../actions";

const inputClass =
  "h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong";
const labelClass = "text-sm font-medium text-foreground";

export default async function ReLoanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await auth();
  const customer = await getCustomerById(session!.user.businessId, id);
  if (!customer) notFound();

  const today = new Date().toISOString().slice(0, 10);

  async function action(formData: FormData) {
    "use server";
    const result = await createReLoan(id, formData);
    if (result.error) {
      redirect(`/customers/${id}/reloan?error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/customers/${id}`);
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          Re-loan
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {customer.name}
        </h1>
        <p className="text-sm text-muted">
          {customer.customerCode} · {customer.routeName} · {customer.phone}
        </p>
      </div>

      <p className="rounded-xl bg-info-soft px-3.5 py-2.5 text-sm text-info">
        This creates a brand-new, independent loan for {customer.name}. Their previous loan and
        all its payment history stay exactly as they are.
      </p>

      {error && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>
      )}

      <form action={action} className="flex flex-col gap-4">
        <LoanTermFields />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className={labelClass}>
            Loan start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={today}
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="loanNotes" className={labelClass}>
            Notes (optional)
          </label>
          <textarea id="loanNotes" name="loanNotes" rows={3} className="rounded-xl border border-border bg-background p-3.5 text-base text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong" />
        </div>
        <SubmitButton className="h-12 rounded-xl bg-brand-navy text-base font-medium text-white shadow-sm dark:bg-brand-navy-strong disabled:opacity-50">
          Create new loan
        </SubmitButton>
      </form>
    </div>
  );
}
