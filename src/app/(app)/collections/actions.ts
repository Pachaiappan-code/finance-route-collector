"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
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

/**
 * Records a payment against a cycle. Used for full payment, partial payment,
 * and adding another later payment — they're all the same operation. Amount
 * and date are always freely editable by the user (payments are not
 * restricted to the route's collection day).
 *
 * A single entry can be split across cash and GPay (most customers pay this
 * way) — each non-zero side becomes its own payment row, since a payment row
 * always has exactly one method. Both rows share one clientRequestId base
 * (suffixed per method) so a retried submission can't double-insert either
 * side.
 *
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds, so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function recordPayment(formData: FormData): Promise<{ error?: string }> {
  const businessId = await requireBusinessId();
  const parsed = recordPaymentSchema.safeParse({
    cycleId: formData.get("cycleId"),
    cashAmount: formData.get("cashAmount") || 0,
    gpayAmount: formData.get("gpayAmount") || 0,
    paymentDate: formData.get("paymentDate"),
    paymentTime: formData.get("paymentTime"),
    notes: formData.get("notes") ?? "",
    clientRequestId: formData.get("clientRequestId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  const cycle = await getCycleById(businessId, data.cycleId);
  if (!cycle) return { error: "Collection cycle not found" };

  const session = await auth();

  const splits: { method: "cash" | "gpay"; amount: number; clientRequestId: string }[] = [];
  if (data.cashAmount > 0) {
    splits.push({ method: "cash", amount: data.cashAmount, clientRequestId: `${data.clientRequestId}:cash` });
  }
  if (data.gpayAmount > 0) {
    splits.push({ method: "gpay", amount: data.gpayAmount, clientRequestId: `${data.clientRequestId}:gpay` });
  }

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ clientRequestId: payments.clientRequestId })
      .from(payments)
      .where(
        inArray(
          payments.clientRequestId,
          splits.map((s) => s.clientRequestId),
        ),
      );
    const alreadyInserted = new Set(existing.map((e) => e.clientRequestId));

    for (const split of splits) {
      if (alreadyInserted.has(split.clientRequestId)) continue;
      await tx.insert(payments).values({
        customerId: cycle.customerId,
        collectionCycleId: cycle.id,
        amount: String(split.amount),
        paymentDate: data.paymentDate,
        paymentTime: data.paymentTime,
        paymentMethod: split.method,
        notes: data.notes || null,
        clientRequestId: split.clientRequestId,
        createdByUserId: session!.user.id,
      });
    }

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
  return {};
}

/**
 * Edits an existing payment's amount/date/method/notes in place. Payment
 * history stays fully editable — nothing is locked.
 *
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds, so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function editPayment(formData: FormData): Promise<{ error?: string }> {
  const businessId = await requireBusinessId();
  const parsed = editPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
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
  if (!payment) return { error: "Payment not found" };

  // Confirm the payment belongs to this business via its cycle.
  if (payment.collectionCycleId) {
    const cycle = await getCycleById(businessId, payment.collectionCycleId);
    if (!cycle) return { error: "Payment not found" };
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
  return {};
}

/**
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds, so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function recordDue(formData: FormData): Promise<{ error?: string }> {
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
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  const cycle = await getCycleById(businessId, data.cycleId);
  if (!cycle) return { error: "Collection cycle not found" };

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
  return {};
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
