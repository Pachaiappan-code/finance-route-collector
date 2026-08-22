import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Customers
        </h1>
        <Link
          href="/customers/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm dark:bg-brand-navy-strong"
        >
          <Plus size={15} /> New
        </Link>
      </div>

      <form className="relative" action="/customers">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, code, area..."
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong"
        />
      </form>

      {customers.length === 0 && (
        <p className="text-sm text-muted">No customers found.</p>
      )}

      <div className="flex flex-col gap-2">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium text-foreground">
                {c.name}{" "}
                {!c.isActive && (
                  <span className="text-xs font-normal text-muted">(inactive)</span>
                )}
              </p>
              <p className="text-xs text-muted">
                {c.customerCode} · {c.routeName} · {c.phone}
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(Number(c.outstandingAmount))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
