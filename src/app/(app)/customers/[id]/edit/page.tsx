import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getCustomerById, listActiveRoutesForSelect } from "@/lib/db/queries/customers";
import { getPrimaryLoanForCustomer } from "@/lib/db/queries/loans";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { EditCustomerForm } from "./edit-customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const businessId = session!.user.businessId;

  const customer = await getCustomerById(businessId, id);
  if (!customer) notFound();

  const [routes, loan] = await Promise.all([
    listActiveRoutesForSelect(businessId),
    getPrimaryLoanForCustomer(id),
  ]);

  const editableLoan = loan && loan.status === "active" ? loan : null;

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit customer</h1>

      <EditCustomerForm
        customerId={id}
        customer={customer}
        routes={routes.map((r) => ({
          id: r.id,
          label: `${dayOfWeekName(r.dayOfWeek)} · ${r.name}`,
        }))}
        loan={
          editableLoan
            ? {
                id: editableLoan.id,
                principalAmount: editableLoan.principalAmount,
                interestAmount: editableLoan.interestAmount,
                numberOfMonths: editableLoan.numberOfMonths,
                startDate: editableLoan.startDate,
              }
            : null
        }
      />
    </div>
  );
}
