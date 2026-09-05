import Link from "next/link";
import { Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { formatDisplayDate, formatDisplayTime } from "@/lib/utils/date";
import type { CycleStatus } from "@/lib/db/queries/cycles";

const STATUS_STYLE: Record<CycleStatus, string> = {
  paid: "bg-success-soft text-success",
  partial: "bg-warning-soft text-warning",
  unpaid: "bg-danger-soft text-danger",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export type CycleListItem = {
  cycleId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: CycleStatus;
  expectedAmount: string;
  paidAmount: string;
  lastPaymentDate?: string | null;
  promisedDate?: string | null;
  promisedTime?: string | null;
};

export function CycleList({ items }: { items: CycleListItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No customers found.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const expected = Number(item.expectedAmount);
        const paid = Number(item.paidAmount);
        const remaining = Math.max(expected - paid, 0);
        return (
          <Link
            key={item.cycleId}
            href={`/customers/${item.customerId}`}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-info">
                  {initials(item.customerName)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.customerName}</p>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Phone size={11} /> {item.customerPhone}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[item.status]}`}
              >
                {item.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted">Expected</p>
                <p className="font-medium text-foreground">{formatCurrency(expected)}</p>
              </div>
              <div>
                <p className="text-muted">Paid</p>
                <p className="font-medium text-success">{formatCurrency(paid)}</p>
              </div>
              <div>
                <p className="text-muted">Remaining</p>
                <p className="font-medium text-danger">{formatCurrency(remaining)}</p>
              </div>
            </div>

            {(item.lastPaymentDate || item.promisedDate) && (
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2.5 text-xs text-muted">
                {item.lastPaymentDate && (
                  <span>Last payment: {formatDisplayDate(item.lastPaymentDate)}</span>
                )}
                {item.promisedDate && (
                  <span className="font-medium text-warning">
                    Promised: {formatDisplayDate(item.promisedDate)}
                    {item.promisedTime ? ` ${formatDisplayTime(item.promisedTime)}` : ""}
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
