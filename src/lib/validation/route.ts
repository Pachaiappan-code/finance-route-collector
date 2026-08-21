import { z } from "zod";

export const routeInputSchema = z.object({
  name: z.string().trim().min(1, "Route name is required").max(255),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  routeOrder: z.coerce.number().int().min(0).default(0),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type RouteInput = z.infer<typeof routeInputSchema>;
