import { eq } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { updateBusinessSettings } from "./actions";

export default async function SettingsPage() {
  const session = await auth();
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, session!.user.businessId))
    .limit(1);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>

      <form action={updateBusinessSettings} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Business name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={business?.name}
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currency" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Currency
          </label>
          <input
            id="currency"
            name="currency"
            defaultValue={business?.currency}
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timezone" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Timezone
          </label>
          <input
            id="timezone"
            name="timezone"
            defaultValue={business?.timezone}
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="defaultReminderMinutesBefore"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Default reminder (minutes before)
          </label>
          <input
            id="defaultReminderMinutesBefore"
            name="defaultReminderMinutesBefore"
            type="number"
            defaultValue={business?.defaultReminderMinutesBefore}
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="defaultPaymentMethod"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Default payment method
          </label>
          <select
            id="defaultPaymentMethod"
            name="defaultPaymentMethod"
            defaultValue={business?.defaultPaymentMethod}
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-12 rounded-lg bg-zinc-900 text-base font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save settings
        </button>
      </form>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button className="h-12 w-full rounded-lg border border-red-300 text-base font-medium text-red-600 dark:border-red-900">
          Sign out
        </button>
      </form>
    </div>
  );
}
