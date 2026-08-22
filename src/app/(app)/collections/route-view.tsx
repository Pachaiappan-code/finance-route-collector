"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Phone, Split } from "lucide-react";
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
  pending: "bg-border/60 text-muted",
  paid: "bg-success-soft text-success",
  partial: "bg-warning-soft text-warning",
  due: "bg-danger-soft text-danger",
  rescheduled: "bg-info-soft text-info",
  cancelled: "bg-border/60 text-muted",
  overdue: "bg-danger-soft text-danger",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

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
        <p className="text-sm text-muted">No customers scheduled for this route today.</p>
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
            className="rounded-2xl border border-border bg-surface p-4 transition-shadow"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-info">
                  {initials(s.customerName)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{s.customerName}</p>
                  <a
                    href={`tel:${s.customerPhone}`}
                    className="flex items-center gap-1 text-xs text-muted"
                  >
                    <Phone size={11} /> {s.customerPhone}
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatCurrency(Number(s.expectedAmount))}
                </p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[s.status]}`}
                >
                  {s.status}
                </span>
              </div>
            </div>

            {s.status === "pending" && (
              <div className="mt-3.5 grid grid-cols-3 gap-2">
                <button
                  disabled={isPending}
                  onClick={() => submitPayment(s, Number(s.expectedAmount))}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-success text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> Paid
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    setOpenCard(s.scheduleId);
                    setOpenAction("due");
                  }}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-danger text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Clock size={16} /> Due
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    setOpenCard(s.scheduleId);
                    setOpenAction("partial");
                  }}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-warning text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Split size={16} /> Partial
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
                className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3.5"
              >
                <label className="text-xs font-medium text-muted">Amount paid</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  max={s.expectedAmount}
                  required
                  autoFocus
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-10 flex-1 rounded-xl bg-brand-navy text-sm font-medium text-white dark:bg-brand-navy-strong"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenCard(null)}
                    className="h-10 flex-1 rounded-xl border border-border text-sm font-medium text-foreground"
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
                className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3.5"
              >
                <label className="text-xs font-medium text-muted">Promised date</label>
                <input
                  name="promisedDate"
                  type="date"
                  required
                  autoFocus
                  min={todayDate()}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong"
                />
                <label className="text-xs font-medium text-muted">Promised time</label>
                <input
                  name="promisedTime"
                  type="time"
                  required
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong"
                />
                <label className="text-xs font-medium text-muted">
                  Promised amount (optional)
                </label>
                <input
                  name="promisedAmount"
                  type="number"
                  step="0.01"
                  defaultValue={s.expectedAmount}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong"
                />
                <label className="text-xs font-medium text-muted">Reason</label>
                <input
                  name="reason"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong"
                />
                <label className="text-xs font-medium text-muted">Remind me</label>
                <select
                  name="reminderOffset"
                  defaultValue="15_min_before"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong"
                >
                  <option value="15_min_before">15 minutes before</option>
                  <option value="30_min_before">30 minutes before</option>
                  <option value="1_hour_before">1 hour before</option>
                  <option value="exact_time">Exact time</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-10 flex-1 rounded-xl bg-brand-navy text-sm font-medium text-white dark:bg-brand-navy-strong"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenCard(null)}
                    className="h-10 flex-1 rounded-xl border border-border text-sm font-medium text-foreground"
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
