import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { createRoute } from "../actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function action(formData: FormData) {
  "use server";
  await createRoute(formData);
  redirect("/routes");
}

const inputClass =
  "h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong";
const labelClass = "text-sm font-medium text-foreground";

export default function NewRoutePage() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New route
      </h1>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={labelClass}>
            Route name
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dayOfWeek" className={labelClass}>
            Day of week
          </label>
          <select id="dayOfWeek" name="dayOfWeek" required className={inputClass}>
            {DAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="routeOrder" className={labelClass}>
            Route order
          </label>
          <input
            id="routeOrder"
            name="routeOrder"
            type="number"
            defaultValue={0}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className={labelClass}>
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="rounded-xl border border-border bg-background p-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong"
          />
        </div>
        <SubmitButton className="h-12 rounded-xl bg-brand-navy text-base font-medium text-white shadow-sm dark:bg-brand-navy-strong disabled:opacity-50">
          Create route
        </SubmitButton>
      </form>
    </div>
  );
}
