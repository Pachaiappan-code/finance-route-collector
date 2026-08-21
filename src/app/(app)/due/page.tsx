import { auth } from "@/lib/auth/config";
import { listDueCustomers } from "@/lib/db/queries/due";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";

export default async function DuePage() {
  const session = await auth();
  const due = await listDueCustomers(session!.user.businessId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Due & pending
      </h1>

      {due.length === 0 && (
        <p className="text-sm text-zinc-500">Nothing due. Great job!</p>
      )}

      <div className="flex flex-col gap-2">
        {due.map((d) => (
          <div
            key={d.scheduleId}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Link href={`/customers/${d.customerId}`} className="block">
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {d.customerName}
                </p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(Number(d.expectedAmount))}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                {d.routeName} · scheduled {d.scheduledDate}
                {d.overdueDays > 0 && ` · ${d.overdueDays}d overdue`}
              </p>
              {d.promise && (
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Promised {d.promise.promisedDate} {d.promise.promisedTime ?? ""}
                </p>
              )}
            </Link>
            <a
              href={`tel:${d.customerPhone}`}
              className="mt-2 inline-block text-xs font-medium text-zinc-500"
            >
              Call {d.customerPhone}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
