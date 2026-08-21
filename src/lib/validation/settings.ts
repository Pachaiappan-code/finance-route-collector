import { z } from "zod";
import { paymentMethodValues } from "./collection";

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1).max(255),
  currency: z.string().trim().min(1).max(8),
  timezone: z.string().trim().min(1).max(64),
  defaultReminderMinutesBefore: z.coerce.number().int().min(0).max(1440),
  defaultPaymentMethod: z.enum(paymentMethodValues),
});
