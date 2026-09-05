import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Split,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getMonthSummary } from "@/lib/db/queries/cycles";
import { ensureCurrentMonthCycles } from "@/lib/db/queries/ensure-cycles";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatCurrency } from "@/lib/utils/format";
import { formatMonthLabel } from "@/lib/utils/date";

function StatusTile({
  label,
  value,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "success" | "danger" | "warning" | "info";
  href: string;
}) {
  const toneClasses = {
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  }[tone];

  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-navy/30"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const businessId = session!.user.businessId;
  const cycleMonth = currentCycleMonth();

  await ensureCurrentMonthCycles(businessId, cycleMonth);
  const data = await getMonthSummary(businessId, cycleMonth);

  const collectionPct =
    data.expected > 0 ? Math.min(100, Math.round((data.collected / data.expected) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6 p-4 pt-5">
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          Monthly collection
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {formatMonthLabel(cycleMonth)}
        </h1>
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-navy to-brand-navy-strong p-5 text-white shadow-[0_20px_40px_-20px_rgba(20,34,92,0.5)]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-white/70">Expected this month</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatCurrency(data.expected)}
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
            <p className="font-semibold">{formatCurrency(data.collected)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70">Pending</p>
            <p className="font-semibold">{formatCurrency(data.pending)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-soft text-info">
          <Users size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Total customers</p>
          <p className="text-xs text-muted">{data.totalCustomers} in this month&apos;s cycle</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2.5 text-sm font-medium text-muted">Tap a status to filter by route</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatusTile
            label="Paid"
            value={data.paidCount}
            icon={CheckCircle2}
            tone="success"
            href="/dashboard/paid"
          />
          <StatusTile
            label="Partial"
            value={data.partialCount}
            icon={Split}
            tone="warning"
            href="/dashboard/partial"
          />
          <StatusTile
            label="Unpaid"
            value={data.unpaidCount}
            icon={AlertTriangle}
            tone="danger"
            href="/dashboard/unpaid"
          />
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
            <p className="text-sm font-medium text-foreground">Routes</p>
            <p className="text-xs text-muted">Sunday · Monday · Tuesday</p>
          </div>
        </div>
        <span className="text-sm font-medium text-brand-navy dark:text-brand-navy-strong">
          Open →
        </span>
      </Link>
    </div>
  );
}
