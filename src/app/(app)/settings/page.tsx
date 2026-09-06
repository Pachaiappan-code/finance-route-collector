import { eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { ThemeSettingsControl } from "@/components/theme-settings-control";
import { SubmitButton } from "@/components/submit-button";
import { updateBusinessSettings } from "./actions";

const inputClass =
  "h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong";
const labelClass = "text-sm font-medium text-foreground";

export default async function SettingsPage() {
  const session = await auth();
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, session!.user.businessId))
    .limit(1);

  return (
    <div className="flex flex-col gap-7 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Appearance
        </h2>
        <ThemeSettingsControl />
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Business
        </h2>
        <form action={updateBusinessSettings} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClass}>
              Business name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={business?.name}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currency" className={labelClass}>
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              defaultValue={business?.currency}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="timezone" className={labelClass}>
              Timezone
            </label>
            <input
              id="timezone"
              name="timezone"
              defaultValue={business?.timezone}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="defaultReminderMinutesBefore" className={labelClass}>
              Default reminder (minutes before)
            </label>
            <input
              id="defaultReminderMinutesBefore"
              name="defaultReminderMinutesBefore"
              type="number"
              defaultValue={business?.defaultReminderMinutesBefore}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="defaultPaymentMethod" className={labelClass}>
              Default payment method
            </label>
            <select
              id="defaultPaymentMethod"
              name="defaultPaymentMethod"
              defaultValue={business?.defaultPaymentMethod}
              className={inputClass}
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
          <SubmitButton className="h-12 rounded-xl bg-brand-navy text-base font-medium text-white shadow-sm dark:bg-brand-navy-strong disabled:opacity-50">
            Save settings
          </SubmitButton>
        </form>
      </section>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-danger/30 text-base font-medium text-danger">
          <LogOut size={16} /> Sign out
        </button>
      </form>
    </div>
  );
}
