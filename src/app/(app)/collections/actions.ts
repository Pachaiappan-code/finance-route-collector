"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collectionCycles, paymentPromises, payments, reminders } from "@/lib/db/schema";
import {
  editPaymentSchema,
  recordDueSchema,
  recordPaymentSchema,
} from "@/lib/validation/collection";
import { getCycleById } from "@/lib/db/queries/cycles";

const REMINDER_OFFSET_MINUTES: Record<string, number> = {
  "15_min_before": 15,
  "30_min_before": 30,
  "1_hour_before": 60,
  exact_time: 0,
};

async function requireBusinessId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.businessId;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Recomputes a cycle's cached paidAmount/status from its actual payment rows — the source of truth is always the payments table. */
async function recomputeCycleStatus(tx: Tx, cycleId: string) {
  const [cycle] = await tx
    .select({ expectedAmount: collectionCycles.expectedAmount })
    .from(collectionCycles)
    .where(eq(collectionCycles.id, cycleId))
    .limit(1);
  if (!cycle) return;

  const [{ total }] = await tx
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.collectionCycleId, cycleId));

  const paid = Number(total);
  const expected = Number(cycle.expectedAmount);
  const status = paid <= 0 ? "unpaid" : paid >= expected ? "paid" : "partial";

  await tx
    .update(collectionCycles)
    .set({ paidAmount: String(paid), status, updatedAt: new Date() })
    .where(eq(collectionCycles.id, cycleId));

  return status;
}

/** Records a payment against a cycle. Used for full payment, partial payment, and adding another later payment — they're all the same operation. Amount and date are always freely editable by the user (payments are not restricted to the route's collection day). */
export async function recordPayment(formData: FormData) {
  const businessId = await requireBusinessId();
  const parsed = recordPaymentSchema.safeParse({
    cycleId: formData.get("cycleId"),
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    paymentTime: formData.get("paymentTime"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") ?? "",
    clientRequestId: formData.get("clientRequestId"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const data = parsed.data;

  const cycle = await getCycleById(businessId, data.cycleId);
  if (!cycle) throw new Error("Collection cycle not found");

  const session = await auth();

  await db.transaction(async (tx) => {
    const [existingPayment] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.clientRequestId, data.clientRequestId))
      .limit(1);
    if (existingPayment) return;

    await tx.insert(payments).values({
      customerId: cycle.customerId,
      collectionCycleId: cycle.id,
      amount: String(data.amount),
      paymentDate: data.paymentDate,
      paymentTime: data.paymentTime,
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
      clientRequestId: data.clientRequestId,
      createdByUserId: session!.user.id,
    });

    const newStatus = await recomputeCycleStatus(tx, cycle.id);

    if (newStatus === "paid") {
      // fully settling this month's cycle resolves any pending promise on it
      await tx
        .update(paymentPromises)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(paymentPromises.collectionCycleId, cycle.id),
            eq(paymentPromises.status, "pending"),
          ),
        );

      await tx
        .update(reminders)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(reminders.customerId, cycle.customerId),
            eq(reminders.status, "scheduled"),
            sql`${reminders.paymentPromiseId} in (
              select id from ${paymentPromises}
              where ${paymentPromises.collectionCycleId} = ${cycle.id}
            )`,
          ),
        );
    }
  });

  revalidatePath("/collections");
  revalidatePath("/dashboard");
  revalidatePath("/due");
  revalidatePath("/reports");
  revalidatePath(`/customers/${cycle.customerId}`);
}

/** Edits an existing payment's amount/date/method/notes in place. Payment history stays fully editable — nothing is locked. */
export async function editPayment(formData: FormData) {
  const businessId = await requireBusinessId();
  const parsed = editPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const data = parsed.data;

  const [payment] = await db
    .select({
      id: payments.id,
      customerId: payments.customerId,
      collectionCycleId: payments.collectionCycleId,
    })
    .from(payments)
    .where(eq(payments.id, data.paymentId))
    .limit(1);
  if (!payment) throw new Error("Payment not found");

  // Confirm the payment belongs to this business via its cycle.
  if (payment.collectionCycleId) {
    const cycle = await getCycleById(businessId, payment.collectionCycleId);
    if (!cycle) throw new Error("Payment not found");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        amount: String(data.amount),
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, data.paymentId));

    if (payment.collectionCycleId) {
      await recomputeCycleStatus(tx, payment.collectionCycleId);
    }
  });

  revalidatePath("/collections");
  revalidatePath("/dashboard");
  revalidatePath("/due");
  revalidatePath("/reports");
  revalidatePath(`/customers/${payment.customerId}`);
}

export async function recordDue(formData: FormData) {
  const businessId = await requireBusinessId();
  const parsed = recordDueSchema.safeParse({
    cycleId: formData.get("cycleId"),
    reason: formData.get("reason") ?? "",
    promisedDate: formData.get("promisedDate"),
    promisedTime: formData.get("promisedTime"),
    promisedAmount: formData.get("promisedAmount") || undefined,
    notes: formData.get("notes") ?? "",
    reminderOffset: formData.get("reminderOffset") || "15_min_before",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const data = parsed.data;

  const cycle = await getCycleById(businessId, data.cycleId);
  if (!cycle) throw new Error("Collection cycle not found");

  await db.transaction(async (tx) => {
    const [promise] = await tx
      .insert(paymentPromises)
      .values({
        customerId: cycle.customerId,
        collectionCycleId: cycle.id,
        promisedDate: data.promisedDate,
        promisedTime: data.promisedTime,
        promisedAmount:
          data.promisedAmount !== undefined ? String(data.promisedAmount) : null,
        reason: data.reason || null,
        notes: data.notes || null,
        status: "pending",
      })
      .returning();

    const promiseDateTime = new Date(`${data.promisedDate}T${data.promisedTime}:00+05:30`);
    const offsetMinutes = REMINDER_OFFSET_MINUTES[data.reminderOffset] ?? 15;
    const scheduledAt = new Date(promiseDateTime.getTime() - offsetMinutes * 60_000);

    await tx.insert(reminders).values({
      customerId: cycle.customerId,
      paymentPromiseId: promise.id,
      scheduledAt,
      reminderType: data.reminderOffset,
      status: "scheduled",
    });
  });

  revalidatePath("/collections");
  revalidatePath("/dashboard");
  revalidatePath("/due");
  revalidatePath("/reminders");
  revalidatePath(`/customers/${cycle.customerId}`);
}

export async function cancelPromiseAndReminder(promiseId: string) {
  await requireBusinessId();

  await db.transaction(async (tx) => {
    await tx
      .update(paymentPromises)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(paymentPromises.id, promiseId));

    await tx
      .update(reminders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(reminders.paymentPromiseId, promiseId), eq(reminders.status, "scheduled")));
  });

  revalidatePath("/due");
  revalidatePath("/reminders");
}
