import { auth } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/db/queries/dashboard";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const businessId = session!.user.businessId;

  const data = await getDashboardData(businessId, new Date());

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <p className="text-sm text-zinc-500">{dayOfWeekName(data.dayOfWeek)}</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {data.date}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Expected" value={formatCurrency(data.expectedAmount)} />
        <StatCard label="Collected" value={formatCurrency(data.collectedAmount)} />
        <StatCard label="Pending" value={formatCurrency(data.pendingAmount)} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          Customers ({data.totalCustomers})
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Paid" value={String(data.paidCount)} />
          <StatCard label="Due" value={String(data.dueCount)} />
          <StatCard label="Partial" value={String(data.partialCount)} />
          <StatCard label="Overdue" value={String(data.overdueCount)} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">Today&apos;s routes</h2>
        <StatCard label="Active routes today" value={String(data.todaysRouteCount)} />
      </div>
    </div>
  );
}
