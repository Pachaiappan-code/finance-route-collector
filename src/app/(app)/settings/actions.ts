"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { businessSettingsSchema } from "@/lib/validation/settings";

export async function updateBusinessSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const parsed = businessSettingsSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    defaultReminderMinutesBefore: formData.get("defaultReminderMinutesBefore"),
    defaultPaymentMethod: formData.get("defaultPaymentMethod"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await db
    .update(businesses)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(businesses.id, session.user.businessId));

  revalidatePath("/settings");
}
