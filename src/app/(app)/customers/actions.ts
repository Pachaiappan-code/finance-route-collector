"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collectionCycles, customers, loans, payments, paymentPromises } from "@/lib/db/schema";
import { nextCustomerCode } from "@/lib/db/queries/customers";
import { customerInputSchema } from "@/lib/validation/customer";
import { closeLoanSchema, loanInputSchema } from "@/lib/validation/loan";
import { currentCycleMonth, resolveInitialCycleMonth } from "@/lib/calculations/cycle";
import { formatMonthLabel } from "@/lib/utils/date";

async function requireBusinessId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.businessId;
}

function parseCustomerForm(formData: FormData) {
  const parsed = customerInputSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    alternatePhone: formData.get("alternatePhone") ?? "",
    address: formData.get("address") ?? "",
    area: formData.get("area") ?? "",
    routeId: formData.get("routeId"),
    routeSequence: formData.get("routeSequence") || 0,
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  return parsed.data;
}

function parseLoanForm(formData: FormData) {
  const parsed = loanInputSchema.safeParse({
    principalAmount: formData.get("principalAmount") || 0,
    interestAmount: formData.get("interestAmount") || 0,
    numberOfMonths: formData.get("numberOfMonths"),
    startDate: formData.get("startDate"),
    notes: formData.get("loanNotes") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const data = parsed.data;
  // The owner enters principal, interest and a loan term in months — the
  // total payable and the monthly due amount are always derived from those,
  // never entered directly, so they can never drift out of sync.
  const totalPayableAmount = data.principalAmount + data.interestAmount;
  const monthlyAmount = totalPayableAmount / data.numberOfMonths;
  return { ...data, totalPayableAmount, monthlyAmount };
}

/** Creates a customer together with their first loan and that loan's first collection cycle. */
export async function createCustomer(formData: FormData) {
  const businessId = await requireBusinessId();
  const customerData = parseCustomerForm(formData);
  const loanData = parseLoanForm(formData);
  const customerCode = await nextCustomerCode(businessId);

  const newCustomerId = await db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({
        businessId,
        customerCode,
        name: customerData.name,
        phone: customerData.phone,
        alternatePhone: customerData.alternatePhone || null,
        address: customerData.address || null,
        area: customerData.area || null,
        routeId: customerData.routeId,
        routeSequence: customerData.routeSequence,
        // Loan financials now live on `loans`; these inline columns are
        // deprecated but kept NOT NULL for backward compatibility, so we
        // mirror the first loan's numbers into them for any old code path.
        principalAmount: String(loanData.principalAmount),
        interestAmount: String(loanData.interestAmount),
        totalRepaymentAmount: String(loanData.totalPayableAmount),
        collectionAmount: String(loanData.monthlyAmount),
        outstandingAmount: String(loanData.totalPayableAmount),
        startDate: loanData.startDate,
        notes: customerData.notes || null,
      })
      .returning({ id: customers.id });

    const [loan] = await tx
      .insert(loans)
      .values({
        customerId: customer.id,
        principalAmount: String(loanData.principalAmount),
        interestAmount: String(loanData.interestAmount),
        totalPayableAmount: String(loanData.totalPayableAmount),
        monthlyAmount: String(loanData.monthlyAmount),
        numberOfMonths: loanData.numberOfMonths,
        startDate: loanData.startDate,
        status: "active",
        notes: loanData.notes || null,
      })
      .returning({ id: loans.id });

    await tx.insert(collectionCycles).values({
      loanId: loan.id,
      customerId: customer.id,
      routeId: customerData.routeId,
      cycleMonth: resolveInitialCycleMonth(loanData.startDate),
      expectedAmount: String(loanData.monthlyAmount),
      status: "unpaid",
    });

    return customer.id;
  });

  revalidatePath("/customers");
  redirect(`/customers/${newCustomerId}`);
}

/** Updates customer profile fields only — loan terms are changed via re-loan, not by editing the customer record. */
export async function updateCustomer(customerId: string, formData: FormData) {
  const businessId = await requireBusinessId();
  const data = parseCustomerForm(formData);

  await db
    .update(customers)
    .set({
      name: data.name,
      phone: data.phone,
      alternatePhone: data.alternatePhone || null,
      address: data.address || null,
      area: data.area || null,
      routeId: data.routeId,
      routeSequence: data.routeSequence,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.businessId, businessId), eq(customers.id, customerId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

/**
 * Permanently deletes a customer, but only when it's safe: if any payment or
 * payment promise was ever recorded against them, deletion is refused (use
 * Deactivate instead) so real financial history can never be destroyed. This
 * is meant for cleaning up customers added by mistake, not for real accounts.
 *
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds (they
 * arrive on the client as a generic "Minified React error #441"), so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function deleteCustomer(
  customerId: string,
): Promise<{ error?: string }> {
  const businessId = await requireBusinessId();

  const [customer] = await db
    .select({ id: customers.id, businessId: customers.businessId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer || customer.businessId !== businessId) {
    return { error: "Customer not found" };
  }

  const [hasPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .limit(1);
  if (hasPayment) {
    return {
      error:
        "This customer has recorded payments and can't be deleted — use Deactivate instead to keep their history.",
    };
  }

  const [hasPromise] = await db
    .select({ id: paymentPromises.id })
    .from(paymentPromises)
    .where(eq(paymentPromises.customerId, customerId))
    .limit(1);
  if (hasPromise) {
    return {
      error:
        "This customer has a payment promise on file and can't be deleted — use Deactivate instead.",
    };
  }

  await db.transaction(async (tx) => {
    const customerLoans = await tx
      .select({ id: loans.id })
      .from(loans)
      .where(eq(loans.customerId, customerId));
    const loanIds = customerLoans.map((l) => l.id);

    if (loanIds.length > 0) {
      await tx.delete(collectionCycles).where(inArray(collectionCycles.loanId, loanIds));
      await tx.delete(loans).where(inArray(loans.id, loanIds));
    }

    await tx.delete(customers).where(eq(customers.id, customerId));
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return {};
}

/**
 * Activates or deactivates a customer. Deactivating is refused while the
 * customer's active loan has a pending (unpaid/partial) payment for the
 * current month — settle or record it first, so a customer can't be hidden
 * from the collection lists while they still owe money this month.
 *
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds, so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function toggleCustomerActive(
  customerId: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  const businessId = await requireBusinessId();

  if (!isActive) {
    const cycleMonth = currentCycleMonth();
    const [pending] = await db
      .select({ status: collectionCycles.status })
      .from(collectionCycles)
      .innerJoin(loans, eq(collectionCycles.loanId, loans.id))
      .where(
        and(
          eq(collectionCycles.customerId, customerId),
          eq(collectionCycles.cycleMonth, cycleMonth),
          eq(loans.status, "active"),
          inArray(collectionCycles.status, ["unpaid", "partial"]),
        ),
      )
      .limit(1);
    if (pending) {
      return {
        error: `This customer has a pending payment for ${formatMonthLabel(cycleMonth)} — settle it before deactivating.`,
      };
    }
  }

  await db
    .update(customers)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(customers.businessId, businessId), eq(customers.id, customerId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return {};
}

/**
 * Re-loan: creates a brand-new, independent loan (and its first cycle) for an
 * existing customer. The old loan and all its history are left untouched.
 *
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds (they
 * arrive on the client as a generic "Minified React error #441"), so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function createReLoan(
  customerId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const businessId = await requireBusinessId();

  const [customer] = await db
    .select({ id: customers.id, routeId: customers.routeId, businessId: customers.businessId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer || customer.businessId !== businessId) {
    return { error: "Customer not found" };
  }

  let loanData: ReturnType<typeof parseLoanForm>;
  try {
    loanData = parseLoanForm(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid loan details" };
  }

  await db.transaction(async (tx) => {
    const [loan] = await tx
      .insert(loans)
      .values({
        customerId: customer.id,
        principalAmount: String(loanData.principalAmount),
        interestAmount: String(loanData.interestAmount),
        totalPayableAmount: String(loanData.totalPayableAmount),
        monthlyAmount: String(loanData.monthlyAmount),
        numberOfMonths: loanData.numberOfMonths,
        startDate: loanData.startDate,
        status: "active",
        notes: loanData.notes || null,
      })
      .returning({ id: loans.id });

    await tx.insert(collectionCycles).values({
      loanId: loan.id,
      customerId: customer.id,
      routeId: customer.routeId,
      cycleMonth: resolveInitialCycleMonth(loanData.startDate),
      expectedAmount: String(loanData.monthlyAmount),
      status: "unpaid",
    });
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath(`/customers/${customerId}`);
  return {};
}

/**
 * Manually closes an active loan: records a final outstanding amount (the
 * owner's call — editable away from the computed balance, e.g. to write
 * off a small remainder) and a 1-5 rating of how the customer performed
 * on this loan. Never touches payments/cycles history — closing is a
 * status + record change, not a data deletion. Re-loan becomes available
 * once a loan is completed.
 *
 * Returns `{ error }` instead of throwing for expected failures — Next.js
 * strips thrown Server Action error messages in production builds (they
 * arrive on the client as a generic "Minified React error #441"), so any
 * message the user actually needs to see must come back as data, not a throw.
 */
export async function closeLoan(
  customerId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const businessId = await requireBusinessId();

  const parsed = closeLoanSchema.safeParse({
    loanId: formData.get("loanId"),
    finalOutstandingAmount: formData.get("finalOutstandingAmount"),
    customerRating: formData.get("customerRating"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  const [loan] = await db
    .select({ id: loans.id, customerId: loans.customerId, businessId: customers.businessId })
    .from(loans)
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .where(eq(loans.id, data.loanId))
    .limit(1);

  if (!loan || loan.businessId !== businessId || loan.customerId !== customerId) {
    return { error: "Loan not found" };
  }

  await db
    .update(loans)
    .set({
      status: "completed",
      finalOutstandingAmount: String(data.finalOutstandingAmount),
      customerRating: data.customerRating,
      notes: data.notes || null,
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(loans.id, data.loanId));

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath(`/customers/${customerId}`);
  return {};
}
