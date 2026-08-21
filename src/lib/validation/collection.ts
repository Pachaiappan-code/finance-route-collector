import { z } from "zod";

export const paymentMethodValues = ["cash", "upi", "bank_transfer", "other"] as const;

export const recordPaymentSchema = z.object({
  scheduleId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1),
  paymentTime: z.string().min(1),
  paymentMethod: z.enum(paymentMethodValues),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  clientRequestId: z.string().min(1).max(64),
});

export const reminderOffsetValues = [
  "15_min_before",
  "30_min_before",
  "1_hour_before",
  "exact_time",
] as const;

export const recordDueSchema = z.object({
  scheduleId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
  promisedDate: z.string().min(1, "Promise date is required"),
  promisedTime: z.string().min(1, "Promise time is required"),
  promisedAmount: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  reminderOffset: z.enum(reminderOffsetValues).default("15_min_before"),
});
