import { auth } from "@/lib/auth/config";
import { listDueCustomers } from "@/lib/db/queries/due";
import { formatCurrency } from "@/lib/utils/format";
import { formatDisplayDate, formatDisplayTime, formatMonthLabel } from "@/lib/utils/date";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import Link from "next/link";
import { CheckCircle2, Phone } from "lucide-react";

export default async function DuePage() {
  const session = await auth();
  const cycleMonth = currentCycleMonth();
  const due = await listDueCustomers(session!.user.businessId, cycleMonth);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Due &amp; pending
        </h1>
        <p className="text-sm text-muted">{formatMonthLabel(cycleMonth)}</p>
      </div>

      {due.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-10 text-center">
          <CheckCircle2 size={28} className="text-success" />
          <p className="text-sm font-medium text-foreground">Nothing due</p>
          <p className="text-xs text-muted">All caught up. Great job!</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {due.map((d) => (
          <div key={d.cycleId} className="rounded-2xl border border-border bg-surface p-4">
            <Link href={`/customers/${d.customerId}`} className="block">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{d.customerName}</p>
                <p className="font-semibold text-foreground">{formatCurrency(d.remaining)}</p>
              </div>
              <p className="text-xs text-muted">
                {d.routeName} ·{" "}
                <span className="font-medium capitalize text-danger">{d.status}</span>
              </p>
              {d.promise && (
                <p className="mt-1 text-xs font-medium text-warning">
                  Promised {formatDisplayDate(d.promise.promisedDate)}{" "}
                  {d.promise.promisedTime ? formatDisplayTime(d.promise.promisedTime) : ""}
                </p>
              )}
            </Link>
            <a
              href={`tel:${d.customerPhone}`}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-muted"
            >
              <Phone size={11} /> Call {d.customerPhone}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
