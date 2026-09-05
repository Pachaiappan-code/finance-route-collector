import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listCyclesForMonth, getCycleFollowUpInfo } from "@/lib/db/queries/cycles";
import { getRouteById } from "@/lib/db/queries/routes";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatMonthLabel } from "@/lib/utils/date";
import { CycleList } from "@/components/cycle-list";
import type { CycleStatus } from "@/lib/db/queries/cycles";

const STATUS_LABEL: Record<CycleStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

export default async function DashboardStatusRouteCustomersPage({
  params,
}: {
  params: Promise<{ status: string; routeId: string }>;
}) {
  const { status, routeId } = await params;
  if (status !== "paid" && status !== "partial" && status !== "unpaid") notFound();

  const session = await auth();
  const route = await getRouteById(session!.user.businessId, routeId);
  if (!route) notFound();

  const cycleMonth = currentCycleMonth();
  const cycles = await listCyclesForMonth(session!.user.businessId, cycleMonth, {
    routeId,
    status: status as CycleStatus,
  });
  const followUp = await getCycleFollowUpInfo(cycles.map((c) => c.cycleId));

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          {route.name} · {STATUS_LABEL[status as CycleStatus]}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {cycles.length} customer{cycles.length === 1 ? "" : "s"}
        </h1>
        <p className="text-sm text-muted">{formatMonthLabel(cycleMonth)}</p>
      </div>

      <CycleList
        items={cycles.map((c) => ({
          cycleId: c.cycleId,
          customerId: c.customerId,
          customerName: c.customerName,
          customerPhone: c.customerPhone,
          status: c.status,
          expectedAmount: c.expectedAmount,
          paidAmount: c.paidAmount,
          lastPaymentDate: followUp.get(c.cycleId)?.lastPaymentDate,
          promisedDate: followUp.get(c.cycleId)?.promisedDate,
          promisedTime: followUp.get(c.cycleId)?.promisedTime,
        }))}
      />
    </div>
  );
}
