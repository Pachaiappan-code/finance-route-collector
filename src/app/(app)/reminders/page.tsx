import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listUpcomingReminders } from "@/lib/db/queries/reminders";
import { formatCurrency } from "@/lib/utils/format";
import { cancelPromiseAndReminder } from "../collections/actions";

export default async function RemindersPage() {
  const session = await auth();
  const reminders = await listUpcomingReminders(session!.user.businessId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Reminders</h1>

      {reminders.length === 0 && (
        <p className="text-sm text-zinc-500">No upcoming reminders.</p>
      )}

      <div className="flex flex-col gap-2">
        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between">
              <Link href={`/customers/${r.customerId}`} className="font-medium text-zinc-900 dark:text-zinc-50">
                {r.customerName}
              </Link>
              {r.promisedAmount && (
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(Number(r.promisedAmount))}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Promised {r.promisedDate} {r.promisedTime ?? ""}
            </p>
            <p className="text-xs text-zinc-400">
              Reminder at {new Date(r.scheduledAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
            <form
              action={async () => {
                "use server";
                await cancelPromiseAndReminder(r.promiseId);
              }}
            >
              <button className="mt-2 text-xs font-medium text-red-600">
                Cancel reminder
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
