import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, paymentPromises, reminders } from "@/lib/db/schema";

export async function listUpcomingReminders(businessId: string) {
  return db
    .select({
      id: reminders.id,
      scheduledAt: reminders.scheduledAt,
      status: reminders.status,
      reminderType: reminders.reminderType,
      customerId: customers.id,
      customerName: customers.name,
      promisedDate: paymentPromises.promisedDate,
      promisedTime: paymentPromises.promisedTime,
      promisedAmount: paymentPromises.promisedAmount,
      promiseId: paymentPromises.id,
    })
    .from(reminders)
    .innerJoin(customers, eq(reminders.customerId, customers.id))
    .innerJoin(paymentPromises, eq(reminders.paymentPromiseId, paymentPromises.id))
    .where(and(eq(customers.businessId, businessId), eq(reminders.status, "scheduled")))
    .orderBy(asc(reminders.scheduledAt));
}
