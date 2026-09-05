"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

const inputClass =
  "h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong";
const labelClass = "text-sm font-medium text-foreground";

export function LoanTermFields({
  defaultPrincipal = 0,
  defaultInterest = 0,
  defaultMonths = 1,
}: {
  defaultPrincipal?: number;
  defaultInterest?: number;
  defaultMonths?: number;
}) {
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [interest, setInterest] = useState(defaultInterest);
  const [months, setMonths] = useState(defaultMonths);

  const total = principal + interest;
  const monthly = months > 0 ? total / months : 0;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="principalAmount" className={labelClass}>
          Principal amount
        </label>
        <input
          id="principalAmount"
          name="principalAmount"
          type="number"
          step="0.01"
          value={principal}
          onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="interestAmount" className={labelClass}>
          Interest
        </label>
        <input
          id="interestAmount"
          name="interestAmount"
          type="number"
          step="0.01"
          value={interest}
          onChange={(e) => setInterest(Number(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="numberOfMonths" className={labelClass}>
          Number of months
        </label>
        <input
          id="numberOfMonths"
          name="numberOfMonths"
          type="number"
          min="1"
          step="1"
          required
          value={months}
          onChange={(e) => setMonths(Number(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-info-soft p-3.5">
        <div>
          <p className="text-xs text-info">Total payable</p>
          <p className="text-base font-semibold text-info">{formatCurrency(total)}</p>
        </div>
        <div>
          <p className="text-xs text-info">Monthly amount</p>
          <p className="text-base font-semibold text-info">{formatCurrency(monthly)}</p>
        </div>
      </div>
    </>
  );
}
