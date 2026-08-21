"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordDue, recordPayment } from "./actions";
import { formatCurrency } from "@/lib/utils/format";

type ScheduleRow = {
  scheduleId: string;
  status: string;
  expectedAmount: string;
  cycleNumber: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  routeSequence: number;
  outstandingAmount: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  due: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  rescheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  cancelled: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CollectionRouteView({ schedules }: { schedules: ScheduleRow[] }) {
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<"paid" | "due" | "partial" | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function focusNextPending(currentScheduleId: string) {
    const idx = schedules.findIndex((s) => s.scheduleId === currentScheduleId);
    const next = schedules
      .slice(idx + 1)
      .find((s) => s.status === "pending" || s.status === "due");
    if (next) {
      cardRefs.current[next.scheduleId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function closeAndAdvance(scheduleId: string) {
    setOpenCard(null);
    setOpenAction(null);
    startTransition(() => {
      router.refresh();
    });
    focusNextPending(scheduleId);
  }

  async function submitPayment(schedule: ScheduleRow, amount: number) {
    const fd = new FormData();
    fd.set("scheduleId", schedule.scheduleId);
    fd.set("amount", String(amount));
    fd.set("paymentDate", todayDate());
    fd.set("paymentTime", nowTime());
    fd.set("paymentMethod", "cash");
    fd.set("notes", "");
    fd.set("clientRequestId", `${schedule.scheduleId}-${Date.now()}`);
    await recordPayment(fd);
    closeAndAdvance(schedule.scheduleId);
  }

  async function submitDue(schedule: ScheduleRow, form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("scheduleId", schedule.scheduleId);
    await recordDue(fd);
    closeAndAdvance(schedule.scheduleId);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {schedules.length === 0 && (
        <p className="text-sm text-zinc-500">No customers scheduled for this route today.</p>
      )}
      {schedules.map((s) => {
        const isOpen = openCard === s.scheduleId;
        return (
          <div
            key={s.scheduleId}
            ref={(el) => {
              cardRefs.current[s.scheduleId] = el;
            }}
            data-testid="schedule-card"
            data-customer-name={s.customerName}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {s.customerName}
                </p>
                <a href={`tel:${s.customerPhone}`} className="text-xs text-zinc-500">
                  {s.customerPhone}
                </a>
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(Number(s.expectedAmount))}
                </p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                >
                  {s.status}
                </span>
              </div>
            </div>

            {s.status === "pending" && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  disabled={isPending}
                  onClick={() => submitPayment(s, Number(s.expectedAmount))}
                  className="h-11 rounded-lg bg-emerald-600 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
                >
                  PAID
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    setOpenCard(s.scheduleId);
                    setOpenAction("due");
                  }}
                  className="h-11 rounded-lg bg-red-600 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
                >
                  DUE
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    setOpenCard(s.scheduleId);
                    setOpenAction("partial");
                  }}
                  className="h-11 rounded-lg bg-amber-500 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
                >
                  PARTIAL
                </button>
              </div>
            )}

            {isOpen && openAction === "partial" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const amount = Number(
                    new FormData(e.currentTarget).get("amount"),
                  );
                  submitPayment(s, amount);
                }}
                className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
              >
                <label className="text-xs font-medium text-zinc-500">Amount paid</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  max={s.expectedAmount}
                  required
                  autoFocus
                  className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-10 flex-1 rounded-lg bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenCard(null)}
                    className="h-10 flex-1 rounded-lg border border-zinc-300 text-sm font-medium dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {isOpen && openAction === "due" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitDue(s, e.currentTarget);
                }}
                className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
              >
                <label className="text-xs font-medium text-zinc-500">Promised date</label>
                <input
                  name="promisedDate"
                  type="date"
                  required
                  autoFocus
                  min={todayDate()}
                  className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label className="text-xs font-medium text-zinc-500">Promised time</label>
                <input
                  name="promisedTime"
                  type="time"
                  required
                  className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label className="text-xs font-medium text-zinc-500">
                  Promised amount (optional)
                </label>
                <input
                  name="promisedAmount"
                  type="number"
                  step="0.01"
                  defaultValue={s.expectedAmount}
                  className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label className="text-xs font-medium text-zinc-500">Reason</label>
                <input
                  name="reason"
                  className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label className="text-xs font-medium text-zinc-500">Remind me</label>
                <select
                  name="reminderOffset"
                  defaultValue="15_min_before"
                  className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="15_min_before">15 minutes before</option>
                  <option value="30_min_before">30 minutes before</option>
                  <option value="1_hour_before">1 hour before</option>
                  <option value="exact_time">Exact time</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-10 flex-1 rounded-lg bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenCard(null)}
                    className="h-10 flex-1 rounded-lg border border-zinc-300 text-sm font-medium dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
