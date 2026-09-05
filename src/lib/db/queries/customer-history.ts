import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionCycles, loans, payments, paymentPromises } from "@/lib/db/schema";

/** Every loan a customer has ever had, each with its full cycle/payment/promise history — newest loan first. */
export async function getCustomerLoanHistory(customerId: string) {
  const customerLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.customerId, customerId))
    .orderBy(desc(loans.startDate), desc(loans.createdAt));

  if (customerLoans.length === 0) return [];

  const loanIds = customerLoans.map((l) => l.id);

  const cycles = await db
    .select()
    .from(collectionCycles)
    .where(inArray(collectionCycles.loanId, loanIds))
    .orderBy(desc(collectionCycles.cycleMonth));

  const cycleIds = cycles.map((c) => c.id);

  const cyclePayments = cycleIds.length
    ? await db
        .select()
        .from(payments)
        .where(inArray(payments.collectionCycleId, cycleIds))
        .orderBy(desc(payments.paymentDate), desc(payments.createdAt))
    : [];

  const cyclePromises = cycleIds.length
    ? await db
        .select()
        .from(paymentPromises)
        .where(inArray(paymentPromises.collectionCycleId, cycleIds))
        .orderBy(desc(paymentPromises.promisedDate))
    : [];

  const paymentsByCycle = new Map<string, typeof cyclePayments>();
  for (const p of cyclePayments) {
    if (!p.collectionCycleId) continue;
    const list = paymentsByCycle.get(p.collectionCycleId) ?? [];
    list.push(p);
    paymentsByCycle.set(p.collectionCycleId, list);
  }

  const promisesByCycle = new Map<string, typeof cyclePromises>();
  for (const p of cyclePromises) {
    if (!p.collectionCycleId) continue;
    const list = promisesByCycle.get(p.collectionCycleId) ?? [];
    list.push(p);
    promisesByCycle.set(p.collectionCycleId, list);
  }

  const cyclesByLoan = new Map<string, typeof cycles>();
  for (const c of cycles) {
    const list = cyclesByLoan.get(c.loanId) ?? [];
    list.push(c);
    cyclesByLoan.set(c.loanId, list);
  }

  return customerLoans.map((loan) => ({
    loan,
    cycles: (cyclesByLoan.get(loan.id) ?? []).map((cycle) => ({
      cycle,
      payments: paymentsByCycle.get(cycle.id) ?? [],
      promises: promisesByCycle.get(cycle.id) ?? [],
    })),
  }));
}
