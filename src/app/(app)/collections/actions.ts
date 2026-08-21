"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  collectionSchedules,
  customers,
  paymentPromises,
  payments,
  reminders,
} from "@/lib/db/schema";
import {
  calculateNextCollectionDate,
  toCalendarDate,
} from "@/lib/calculations/cycle";
import { recordDueSchema, recordPaymentSchema } from "@/lib/validation/collection";
import { getPaidTotalForSchedule, getScheduleForCollection } from "@/lib/db/queries/collections";

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

/**
 * Generates the next collection schedule for a customer, but only when the
 * schedule just settled is the customer's most recent one — paying off an
 * old overdue schedule out of order must not fork the cycle chain, and a
 * second call for the same date must not create a duplicate.
 */
async function maybeGenerateNextSchedule(
  tx: Tx,
  customerId: string,
  routeId: string,
  cycleDays: number,
  settledScheduleDate: string,
  settledCycleNumber: number,
  expectedAmount: string,
) {
  const [{ maxDate }] = await tx
    .select({ maxDate: sql<string>`max(${collectionSchedules.scheduledDate})` })
    .from(collectionSchedules)
    .where(eq(collectionSchedules.customerId, customerId));

  if (maxDate !== settledScheduleDate) return;

  const nextDate = toCalendarDate(
    calculateNextCollectionDate(new Date(`${settledScheduleDate}T00:00:00`), cycleDays),
  );

  const [existing] = await tx
    .select({ id: collectionSchedules.id })
    .from(collectionSchedules)
    .where(
      and(
        eq(collectionSchedules.customerId, customerId),
        eq(collectionSchedules.scheduledDate, nextDate),
      ),
    )
    .limit(1);

  if (existing) return;

  await tx.insert(collectionSchedules).values({
    customerId,
    routeId,
    scheduledDate: nextDate,
    expectedAmount,
    cycleNumber: settledCycleNumber + 1,
    status: "pending",
  });
}

export async function recordPayment(formData: FormData) {
  const businessId = await requireBusinessId();
  const parsed = recordPaymentSchema.safeParse({
    scheduleId: formData.get("scheduleId"),
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

  const schedule = await getScheduleForCollection(businessId, data.scheduleId);
  if (!schedule) throw new Error("Collection schedule not found");

  const session = await auth();

  await db.transaction(async (tx) => {
    const [existingPayment] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.clientRequestId, data.clientRequestId))
      .limit(1);
    if (existingPayment) return;

    await tx.insert(payments).values({
      customerId: schedule.customerId,
      collectionScheduleId: schedule.scheduleId,
      amount: String(data.amount),
      paymentDate: data.paymentDate,
      paymentTime: data.paymentTime,
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
      clientRequestId: data.clientRequestId,
      createdByUserId: session!.user.id,
    });

    const alreadyPaid = await getPaidTotalForSchedule(schedule.scheduleId);
    const totalPaid = alreadyPaid + data.amount;
    const expected = Number(schedule.expectedAmount);
    const isFullyPaid = totalPaid >= expected;

    await tx
      .update(collectionSchedules)
      .set({ status: isFullyPaid ? "paid" : "partial", updatedAt: new Date() })
      .where(eq(collectionSchedules.id, schedule.scheduleId));

    await tx
      .update(customers)
      .set({
        outstandingAmount: sql`greatest(${customers.outstandingAmount} - ${data.amount}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, schedule.customerId));

    // completing a payment resolves any pending promise on this schedule
    await tx
      .update(paymentPromises)
      .set({ status: "completed", updatedAt: new Date() })
      .where(
        and(
          eq(paymentPromises.collectionScheduleId, schedule.scheduleId),
          eq(paymentPromises.status, "pending"),
        ),
      );

    await tx
      .update(reminders)
      .set({ status: "completed", updatedAt: new Date() })
      .where(
        and(
          eq(reminders.customerId, schedule.customerId),
          eq(reminders.status, "scheduled"),
          sql`${reminders.paymentPromiseId} in (
            select id from ${paymentPromises}
            where ${paymentPromises.collectionScheduleId} = ${schedule.scheduleId}
          )`,
        ),
      );

    if (isFullyPaid) {
      await maybeGenerateNextSchedule(
        tx,
        schedule.customerId,
        schedule.routeId,
        schedule.cycleDays,
        schedule.scheduledDate,
        schedule.cycleNumber,
        schedule.expectedAmount,
      );
    }
  });

  revalidatePath("/collections");
  revalidatePath("/dashboard");
  revalidatePath("/due");
  revalidatePath(`/customers/${schedule.customerId}`);
}

export async function recordDue(formData: FormData) {
  const businessId = await requireBusinessId();
  const parsed = recordDueSchema.safeParse({
    scheduleId: formData.get("scheduleId"),
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

  const schedule = await getScheduleForCollection(businessId, data.scheduleId);
  if (!schedule) throw new Error("Collection schedule not found");

  await db.transaction(async (tx) => {
    await tx
      .update(collectionSchedules)
      .set({ status: "due", updatedAt: new Date() })
      .where(eq(collectionSchedules.id, schedule.scheduleId));

    const [promise] = await tx
      .insert(paymentPromises)
      .values({
        customerId: schedule.customerId,
        collectionScheduleId: schedule.scheduleId,
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
      customerId: schedule.customerId,
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
  revalidatePath(`/customers/${schedule.customerId}`);
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
