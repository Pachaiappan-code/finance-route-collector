"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Phone, Split } from "lucide-react";
import { recordDue, recordPayment } from "./actions";
import { formatCurrency } from "@/lib/utils/format";
import type { CycleListRow, CycleStatus } from "@/lib/db/queries/cycles";

const STATUS_STYLE: Record<CycleStatus, string> = {
  unpaid: "bg-border/60 text-muted",
  paid: "bg-success-soft text-success",
  partial: "bg-warning-soft text-warning",
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

export function CollectionRouteView({ cycles }: { cycles: CycleListRow[] }) {
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<"due" | "partial" | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function focusNextPending(currentCycleId: string) {
    const idx = cycles.findIndex((c) => c.cycleId === currentCycleId);
    const next = cycles.slice(idx + 1).find((c) => c.status !== "paid");
    if (next) {
      cardRefs.current[next.cycleId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function closeAndAdvance(cycleId: string) {
    setOpenCard(null);
    setOpenAction(null);
    startTransition(() => {
      router.refresh();
    });
    focusNextPending(cycleId);
  }

  async function submitPayment(cycle: CycleListRow, amount: number) {
    const fd = new FormData();
    fd.set("cycleId", cycle.cycleId);
    fd.set("amount", String(amount));
    fd.set("paymentDate", todayDate());
    fd.set("paymentTime", nowTime());
    fd.set("paymentMethod", "cash");
    fd.set("notes", "");
    fd.set("clientRequestId", crypto.randomUUID());
    await recordPayment(fd);
    closeAndAdvance(cycle.cycleId);
  }

  async function submitDue(cycle: CycleListRow, form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("cycleId", cycle.cycleId);
    await recordDue(fd);
    closeAndAdvance(cycle.cycleId);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {cycles.length === 0 && (
        <p className="text-sm text-muted">No customers scheduled for this route this month.</p>
      )}
      {cycles.map((c) => {
        const isOpen = openCard === c.cycleId;
        const remaining = Math.max(Number(c.expectedAmount) - Number(c.paidAmount), 0);
        return (
          <div
            key={c.cycleId}
            ref={(el) => {
              cardRefs.current[c.cycleId] = el;
            }}
            data-testid="cycle-card"
            data-customer-name={c.customerName}
            onClick={() => {
              if (c.status === "paid") router.push(`/customers/${c.customerId}`);
            }}
            className={`rounded-2xl border border-border bg-surface p-4 ${
              c.status === "paid" ? "cursor-pointer active:bg-info-soft/40" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-info">
                  {initials(c.customerName)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{c.customerName}</p>
                  <a
                    href={`tel:${c.customerPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-muted"
                  >
                    <Phone size={11} /> {c.customerPhone}
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{formatCurrency(remaining)}</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[c.status]}`}
                >
                  {c.status}
                </span>
                {c.status === "paid" && (
                  <p className="mt-1 text-[10px] text-muted">Tap to view profile</p>
                )}
              </div>
            </div>

            {c.status !== "paid" && (
              <div className="mt-3.5 grid grid-cols-3 gap-2">
                <button
                  disabled={isPending}
                  onClick={() => submitPayment(c, remaining)}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-success text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> Paid
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    setOpenCard(c.cycleId);
                    setOpenAction("due");
                  }}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-danger text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Clock size={16} /> Due
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    setOpenCard(c.cycleId);
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
                  const amount = Number(new FormData(e.currentTarget).get("amount"));
                  submitPayment(c, amount);
                }}
                className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3.5"
              >
                <label className="text-xs font-medium text-muted">Amount paid</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  max={remaining}
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
                  submitDue(c, e.currentTarget);
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
                  defaultValue={remaining}
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
