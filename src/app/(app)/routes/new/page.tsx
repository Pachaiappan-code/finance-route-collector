import { redirect } from "next/navigation";
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

export default function NewRoutePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New route
      </h1>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Route name
          </label>
          <input
            id="name"
            name="name"
            required
            className="h-12 rounded-lg border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dayOfWeek" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Day of week
          </label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            className="h-12 rounded-lg border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {DAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="routeOrder" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Route order
          </label>
          <input
            id="routeOrder"
            name="routeOrder"
            type="number"
            defaultValue={0}
            className="h-12 rounded-lg border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="rounded-lg border border-zinc-300 p-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-lg bg-zinc-900 text-base font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create route
        </button>
      </form>
    </div>
  );
}
