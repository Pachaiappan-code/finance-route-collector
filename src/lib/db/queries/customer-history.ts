import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionSchedules, payments, paymentPromises } from "@/lib/db/schema";

export async function getCustomerHistory(customerId: string) {
  const schedules = await db
    .select()
    .from(collectionSchedules)
    .where(eq(collectionSchedules.customerId, customerId))
    .orderBy(desc(collectionSchedules.scheduledDate));

  const customerPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .orderBy(desc(payments.paymentDate));

  const customerPromises = await db
    .select()
    .from(paymentPromises)
    .where(eq(paymentPromises.customerId, customerId))
    .orderBy(desc(paymentPromises.promisedDate));

  const paymentsBySchedule = new Map<string, typeof customerPayments>();
  for (const p of customerPayments) {
    const list = paymentsBySchedule.get(p.collectionScheduleId) ?? [];
    list.push(p);
    paymentsBySchedule.set(p.collectionScheduleId, list);
  }

  const promisesBySchedule = new Map<string, typeof customerPromises>();
  for (const p of customerPromises) {
    const list = promisesBySchedule.get(p.collectionScheduleId) ?? [];
    list.push(p);
    promisesBySchedule.set(p.collectionScheduleId, list);
  }

  return schedules.map((schedule) => ({
    schedule,
    payments: paymentsBySchedule.get(schedule.id) ?? [],
    promises: promisesBySchedule.get(schedule.id) ?? [],
  }));
}
