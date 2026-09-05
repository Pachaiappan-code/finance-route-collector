"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { editPayment, recordDue, recordPayment } from "../../collections/actions";
import { formatCurrency } from "@/lib/utils/format";
import { formatDisplayDate, formatDisplayTime } from "@/lib/utils/date";

type PaymentRow = {
  id: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
};

type PromiseRow = {
  id: string;
  promisedDate: string;
  promisedTime: string | null;
  promisedAmount: string | null;
  status: string;
};

const inputClass =
  "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AddPaymentForm({ cycleId, remaining }: { cycleId: string; remaining: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-11 flex-1 rounded-xl bg-success text-sm font-semibold text-white shadow-sm"
      >
        Add payment
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("cycleId", cycleId);
        fd.set("clientRequestId", crypto.randomUUID());
        const result = await recordPayment(fd);
        if (result.error) {
          window.alert(result.error);
          return;
        }
        setOpen(false);
        startTransition(() => router.refresh());
      }}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4"
    >
      <p className="text-sm font-medium text-foreground">Add payment</p>
      <p className="text-xs text-muted">Most customers split cash and GPay — enter either or both.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Cash amount</label>
          <input
            name="cashAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={remaining > 0 ? remaining : undefined}
            autoFocus
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">GPay amount</label>
          <input name="gpayAmount" type="number" step="0.01" min="0" className={inputClass} />
        </div>
      </div>
      <label className="text-xs font-medium text-muted">Payment date</label>
      <input name="paymentDate" type="date" defaultValue={todayDate()} required className={inputClass} />
      <input type="hidden" name="paymentTime" value={nowTime()} />
      <label className="text-xs font-medium text-muted">Notes (optional)</label>
      <input name="notes" className={inputClass} />
      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 flex-1 rounded-xl bg-brand-navy text-sm font-medium text-white dark:bg-brand-navy-strong"
        >
          Save payment
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 flex-1 rounded-xl border border-border text-sm font-medium text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SetReminderForm({ cycleId, remaining }: { cycleId: string; remaining: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-11 flex-1 rounded-xl bg-danger text-sm font-semibold text-white shadow-sm"
      >
        Set reminder
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("cycleId", cycleId);
        const result = await recordDue(fd);
        if (result.error) {
          window.alert(result.error);
          return;
        }
        setOpen(false);
        startTransition(() => router.refresh());
      }}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4"
    >
      <p className="text-sm font-medium text-foreground">Promised payment</p>
      <label className="text-xs font-medium text-muted">Promised date</label>
      <input name="promisedDate" type="date" min={todayDate()} required autoFocus className={inputClass} />
      <label className="text-xs font-medium text-muted">Promised time</label>
      <input name="promisedTime" type="time" required className={inputClass} />
      <label className="text-xs font-medium text-muted">Promised amount (optional)</label>
      <input name="promisedAmount" type="number" step="0.01" defaultValue={remaining > 0 ? remaining : undefined} className={inputClass} />
      <label className="text-xs font-medium text-muted">Reason (optional)</label>
      <input name="reason" className={inputClass} />
      <label className="text-xs font-medium text-muted">Remind me</label>
      <select name="reminderOffset" defaultValue="15_min_before" className={inputClass}>
        <option value="15_min_before">15 minutes before</option>
        <option value="30_min_before">30 minutes before</option>
        <option value="1_hour_before">1 hour before</option>
        <option value="exact_time">Exact time</option>
      </select>
      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 flex-1 rounded-xl bg-brand-navy text-sm font-medium text-white dark:bg-brand-navy-strong"
        >
          Save reminder
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 flex-1 rounded-xl border border-border text-sm font-medium text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentRowItem({ payment }: { payment: PaymentRow }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-success-soft px-3 py-2">
        <div>
          <p className="text-sm font-medium text-success">
            {formatCurrency(Number(payment.amount))}{" "}
            <span className="font-normal capitalize">({payment.paymentMethod})</span>
          </p>
          <p className="text-xs text-muted">
            {formatDisplayDate(payment.paymentDate)}
            {payment.notes ? ` · ${payment.notes}` : ""}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          aria-label="Edit payment"
          className="flex h-8 w-8 items-center justify-center rounded-full text-success hover:bg-success/10"
        >
          <Pencil size={14} />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("paymentId", payment.id);
        const result = await editPayment(fd);
        if (result.error) {
          window.alert(result.error);
          return;
        }
        setEditing(false);
        startTransition(() => router.refresh());
      }}
      className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          name="amount"
          type="number"
          step="0.01"
          defaultValue={payment.amount}
          required
          className={inputClass}
        />
        <input
          name="paymentDate"
          type="date"
          defaultValue={payment.paymentDate}
          required
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        {(["cash", "gpay"] as const).map((m) => (
          <label
            key={m}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-medium capitalize has-[:checked]:border-brand-navy has-[:checked]:bg-info-soft has-[:checked]:text-info dark:has-[:checked]:border-brand-navy-strong"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={m}
              defaultChecked={payment.paymentMethod === m}
              className="sr-only"
            />
            {m}
          </label>
        ))}
      </div>
      <input name="notes" defaultValue={payment.notes ?? ""} placeholder="Notes" className={inputClass} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 flex-1 rounded-xl bg-brand-navy text-xs font-medium text-white dark:bg-brand-navy-strong"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-10 flex-1 rounded-xl border border-border text-xs font-medium text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PromiseRowItem({ promise }: { promise: PromiseRow }) {
  if (promise.status !== "pending") return null;
  return (
    <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
      Promised {formatDisplayDate(promise.promisedDate)}
      {promise.promisedTime ? ` ${formatDisplayTime(promise.promisedTime)}` : ""}
      {promise.promisedAmount ? ` · ${formatCurrency(Number(promise.promisedAmount))}` : ""}
    </p>
  );
}
