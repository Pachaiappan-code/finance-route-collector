import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listCustomers } from "@/lib/db/queries/customers";
import { formatCurrency } from "@/lib/utils/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const customers = await listCustomers(session!.user.businessId, q);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Customers
        </h1>
        <Link
          href="/customers/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          + New
        </Link>
      </div>

      <form className="flex" action="/customers">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, code, area..."
          className="h-11 flex-1 rounded-lg border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </form>

      {customers.length === 0 && (
        <p className="text-sm text-zinc-500">No customers found.</p>
      )}

      <div className="flex flex-col gap-2">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {c.name}{" "}
                {!c.isActive && (
                  <span className="text-xs font-normal text-zinc-400">(inactive)</span>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                {c.customerCode} · {c.routeName} · {c.phone}
              </p>
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formatCurrency(Number(c.outstandingAmount))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
