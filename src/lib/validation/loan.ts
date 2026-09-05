import { z } from "zod";

export const loanInputSchema = z.object({
  principalAmount: z.coerce.number().nonnegative().default(0),
  interestAmount: z.coerce.number().nonnegative().default(0),
  totalPayableAmount: z.coerce.number().nonnegative().default(0),
  monthlyAmount: z.coerce.number().positive("Monthly amount must be greater than 0"),
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
