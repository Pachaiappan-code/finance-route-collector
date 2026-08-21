import { z } from "zod";

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  phone: z.string().trim().min(6, "Phone is required").max(32),
  alternatePhone: z.string().trim().max(32).optional().or(z.literal("")),
  address: z.string().trim().max(1000).optional().or(z.literal("")),
  area: z.string().trim().max(255).optional().or(z.literal("")),

  routeId: z.string().uuid("Select a route"),
  routeSequence: z.coerce.number().int().min(0).default(0),

  principalAmount: z.coerce.number().nonnegative().default(0),
  interestAmount: z.coerce.number().nonnegative().default(0),
  totalRepaymentAmount: z.coerce.number().nonnegative().default(0),
  collectionAmount: z.coerce.number().positive("Collection amount must be greater than 0"),
  cycleDays: z.coerce.number().int().positive("Cycle days must be a positive integer"),
  startDate: z.string().min(1, "Start date is required"),

  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
