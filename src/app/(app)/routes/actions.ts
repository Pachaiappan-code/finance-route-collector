"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema";
import { routeInputSchema } from "@/lib/validation/route";

async function requireBusinessId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.businessId;
}

export async function createRoute(formData: FormData) {
  const businessId = await requireBusinessId();

  const parsed = routeInputSchema.safeParse({
    name: formData.get("name"),
    dayOfWeek: formData.get("dayOfWeek"),
    routeOrder: formData.get("routeOrder") || 0,
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await db.insert(routes).values({
    businessId,
    name: parsed.data.name,
    dayOfWeek: parsed.data.dayOfWeek,
    routeOrder: parsed.data.routeOrder,
    description: parsed.data.description || null,
  });

  revalidatePath("/routes");
}

export async function toggleRouteActive(routeId: string, isActive: boolean) {
  const businessId = await requireBusinessId();

  await db
    .update(routes)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(routes.businessId, businessId), eq(routes.id, routeId)));

  revalidatePath("/routes");
}

export async function updateRoute(routeId: string, formData: FormData) {
  const businessId = await requireBusinessId();

  const parsed = routeInputSchema.safeParse({
    name: formData.get("name"),
    dayOfWeek: formData.get("dayOfWeek"),
    routeOrder: formData.get("routeOrder") || 0,
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await db
    .update(routes)
    .set({
      name: parsed.data.name,
      dayOfWeek: parsed.data.dayOfWeek,
      routeOrder: parsed.data.routeOrder,
      description: parsed.data.description || null,
      updatedAt: new Date(),
    })
    .where(and(eq(routes.businessId, businessId), eq(routes.id, routeId)));

  revalidatePath("/routes");
  revalidatePath(`/routes/${routeId}`);
}
