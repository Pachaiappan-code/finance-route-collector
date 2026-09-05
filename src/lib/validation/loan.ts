import { z } from "zod";

export const loanInputSchema = z.object({
  principalAmount: z.coerce.number().nonnegative().default(0),
  interestAmount: z.coerce.number().nonnegative().default(0),
  // Monthly amount and total payable are derived from principal + interest
  // divided across this many months — the owner enters months, not an amount.
  numberOfMonths: z.coerce.number().int().positive("Number of months must be at least 1"),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

export const closeLoanSchema = z.object({
  loanId: z.string().uuid(),
  finalOutstandingAmount: z.coerce.number().nonnegative(),
  customerRating: z.coerce.number().int().min(1, "Select a rating").max(5),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CloseLoanInput = z.infer<typeof closeLoanSchema>;
