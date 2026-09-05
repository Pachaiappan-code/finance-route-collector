"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { closeLoan } from "../actions";
import { formatCurrency } from "@/lib/utils/format";

const inputClass =
  "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong";

export function CloseLoanForm({
  customerId,
  loanId,
  computedOutstanding,
}: {
  customerId: string;
  loanId: string;
  computedOutstanding: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-navy text-sm font-medium text-brand-navy dark:border-brand-navy-strong dark:text-brand-navy-strong"
      >
        Complete loan
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("loanId", loanId);
        const result = await closeLoan(customerId, fd);
        if (result.error) {
          window.alert(result.error);
          return;
        }
        setOpen(false);
        startTransition(() => router.refresh());
      }}
      className="mt-3 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4"
    >
      <p className="text-sm font-medium text-foreground">Complete loan</p>

      <label className="text-xs font-medium text-muted">
        Final outstanding amount
      </label>
      <input
        name="finalOutstandingAmount"
        type="number"
        step="0.01"
        min="0"
        defaultValue={computedOutstanding}
        required
        autoFocus
        className={inputClass}
      />
      <p className="text-xs text-muted">
        Computed balance is {formatCurrency(computedOutstanding)} — edit this if
        you&apos;re settling for a different amount (e.g. writing off a remainder).
      </p>

      <label className="mt-1 text-xs font-medium text-muted">
        Rate this customer
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border has-[:checked]:border-brand-navy has-[:checked]:bg-info-soft has-[:checked]:text-info dark:has-[:checked]:border-brand-navy-strong"
          >
            <input type="radio" name="customerRating" value={n} required className="sr-only" />
            <Star size={16} />
          </label>
        ))}
      </div>

      <label className="mt-1 text-xs font-medium text-muted">Notes (optional)</label>
      <textarea name="notes" rows={2} className="rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-brand-navy dark:focus:border-brand-navy-strong" />

      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 flex-1 rounded-xl bg-brand-navy text-sm font-medium text-white dark:bg-brand-navy-strong"
        >
          Close loan
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

