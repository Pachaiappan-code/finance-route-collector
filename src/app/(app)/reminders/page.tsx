import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listUpcomingReminders } from "@/lib/db/queries/reminders";
import { formatCurrency } from "@/lib/utils/format";
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from "@/lib/utils/date";
import { cancelPromiseAndReminder } from "../collections/actions";
import { SubmitButton } from "@/components/submit-button";

export default async function RemindersPage() {
  const session = await auth();
  const reminders = await listUpcomingReminders(session!.user.businessId);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reminders</h1>

      {reminders.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-10 text-center">
          <BellOff size={28} className="text-muted" />
          <p className="text-sm font-medium text-foreground">No upcoming reminders</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                <Bell size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link href={`/customers/${r.customerId}`} className="font-medium text-foreground">
                    {r.customerName}
                  </Link>
                  {r.promisedAmount && (
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(Number(r.promisedAmount))}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Promised {formatDisplayDate(r.promisedDate)}{" "}
                  {r.promisedTime ? formatDisplayTime(r.promisedTime) : ""}
                </p>
                <p className="text-xs text-muted">
                  Reminder at {formatDisplayDateTime(r.scheduledAt)}
                </p>
                <form
                  action={async () => {
                    "use server";
                    await cancelPromiseAndReminder(r.promiseId);
                  }}
                >
                  <SubmitButton pendingLabel="Cancelling..." className="mt-2 text-xs font-medium text-danger disabled:opacity-50">
                    Cancel reminder
                  </SubmitButton>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
