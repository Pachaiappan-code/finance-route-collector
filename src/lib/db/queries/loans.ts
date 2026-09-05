import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { loans } from "@/lib/db/schema";

export async function listLoansForCustomer(customerId: string) {
  return db
    .select()
    .from(loans)
    .where(eq(loans.customerId, customerId))
    .orderBy(desc(loans.startDate), desc(loans.createdAt));
}

/** The loan a customer is currently being collected against — the most
 * recently started active loan, or (if none active) the most recent loan
 * of any status, so a fully-completed customer still has something to show. */
export async function getPrimaryLoanForCustomer(customerId: string) {
  const [active] = await db
    .select()
    .from(loans)
    .where(and(eq(loans.customerId, customerId), eq(loans.status, "active")))
    .orderBy(desc(loans.startDate))
    .limit(1);
  if (active) return active;

  const [latest] = await db
    .select()
    .from(loans)
    .where(eq(loans.customerId, customerId))
    .orderBy(desc(loans.startDate))
    .limit(1);
  return latest ?? null;
}

export async function getLoanById(loanId: string) {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  return loan ?? null;
}
