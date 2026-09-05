import { z } from "zod";

// Full set of historically-valid payment methods (for displaying old data).
export const paymentMethodValues = ["cash", "upi", "bank_transfer", "other", "gpay"] as const;

// The only two choices offered when recording or editing a payment.
export const paymentMethodFormValues = ["cash", "gpay"] as const;

// A single payment entry can be split across cash and GPay in one go (most
// customers pay this way) — at least one of the two must be greater than 0.
export const recordPaymentSchema = z
  .object({
    cycleId: z.string().uuid(),
    cashAmount: z.coerce.number().nonnegative().default(0),
    gpayAmount: z.coerce.number().nonnegative().default(0),
    paymentDate: z.string().min(1),
    paymentTime: z.string().min(1),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    clientRequestId: z.string().min(1).max(64),
  })
  .refine((data) => data.cashAmount > 0 || data.gpayAmount > 0, {
    message: "Enter a cash or GPay amount",
    path: ["cashAmount"],
  });

export const editPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(paymentMethodFormValues),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const reminderOffsetValues = [
  "15_min_before",
  "30_min_before",
  "1_hour_before",
  "exact_time",
] as const;

export const recordDueSchema = z.object({
  cycleId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
  promisedDate: z.string().min(1, "Promise date is required"),
  promisedTime: z.string().min(1, "Promise time is required"),
  promisedAmount: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  reminderOffset: z.enum(reminderOffsetValues).default("15_min_before"),
});
