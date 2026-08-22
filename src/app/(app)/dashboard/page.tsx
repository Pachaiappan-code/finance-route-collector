import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Split,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/db/queries/dashboard";
import { dayOfWeekName } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";

function StatusTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "success" | "danger" | "warning" | "info";
}) {
  const toneClasses = {
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  }[tone];

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const businessId = session!.user.businessId;

  const data = await getDashboardData(businessId, new Date());
  const collectionPct =
    data.expectedAmount > 0
      ? Math.min(100, Math.round((data.collectedAmount / data.expectedAmount) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-6 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          {dayOfWeekName(data.dayOfWeek)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {data.date}
        </h1>
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-navy to-brand-navy-strong p-5 text-white shadow-[0_20px_40px_-20px_rgba(20,34,92,0.5)]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-white/70">Expected today</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatCurrency(data.expectedAmount)}
            </p>
          </div>
          <p className="text-sm font-semibold text-white/90">{collectionPct}%</p>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-brand-green-strong transition-all"
            style={{ width: `${collectionPct}%` }}
          />
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <div>
            <p className="text-white/70">Collected</p>
            <p className="font-semibold">{formatCurrency(data.collectedAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70">Pending</p>
            <p className="font-semibold">{formatCurrency(data.pendingAmount)}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2.5 text-sm font-medium text-muted">
          Customers today ({data.totalCustomers})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusTile label="Paid" value={data.paidCount} icon={CheckCircle2} tone="success" />
          <StatusTile label="Due" value={data.dueCount} icon={Clock} tone="danger" />
          <StatusTile label="Partial" value={data.partialCount} icon={Split} tone="warning" />
          <StatusTile label="Overdue" value={data.overdueCount} icon={AlertTriangle} tone="info" />
        </div>
      </div>

      <Link
        href="/collections"
        className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-navy/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-soft text-info">
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Today&apos;s routes</p>
            <p className="text-xs text-muted">
              {data.todaysRouteCount} active route{data.todaysRouteCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          Start →
        </span>
      </Link>
    </div>
  );
}
