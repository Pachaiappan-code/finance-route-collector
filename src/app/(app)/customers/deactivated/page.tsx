import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listCustomers } from "@/lib/db/queries/customers";
import { toggleCustomerActive } from "../actions";

export default async function DeactivatedCustomersPage() {
  const session = await auth();
  const customers = await listCustomers(session!.user.businessId, undefined, "inactive");

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Deactivated customers
        </h1>
        <p className="text-sm text-muted">
          Hidden from the customer list, routes, dashboard and due list. Activate a customer to
          bring them back everywhere.
        </p>
      </div>

      {customers.length === 0 && (
        <p className="text-sm text-muted">No deactivated customers.</p>
      )}

      <div className="flex flex-col gap-2">
        {customers.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <Link href={`/customers/${c.id}`}>
              <p className="font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted">
                {c.customerCode} · {c.routeName} · {c.phone}
              </p>
            </Link>
            <form
              action={async () => {
                "use server";
                await toggleCustomerActive(c.id, true);
              }}
            >
              <button className="rounded-full bg-brand-navy px-3.5 py-1.5 text-xs font-medium text-white dark:bg-brand-navy-strong">
                Activate
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
