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
