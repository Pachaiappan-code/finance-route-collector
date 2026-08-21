"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collectionSchedules, customers } from "@/lib/db/schema";
import { nextCustomerCode } from "@/lib/db/queries/customers";
import { customerInputSchema } from "@/lib/validation/customer";

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
    principalAmount: formData.get("principalAmount") || 0,
    interestAmount: formData.get("interestAmount") || 0,
    totalRepaymentAmount: formData.get("totalRepaymentAmount") || 0,
    collectionAmount: formData.get("collectionAmount"),
    cycleDays: formData.get("cycleDays"),
    startDate: formData.get("startDate"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  return parsed.data;
}

export async function createCustomer(formData: FormData) {
  const businessId = await requireBusinessId();
  const data = parseCustomerForm(formData);
  const customerCode = await nextCustomerCode(businessId);

  const newCustomerId = await db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({
        businessId,
        customerCode,
        name: data.name,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        address: data.address || null,
        area: data.area || null,
        routeId: data.routeId,
        routeSequence: data.routeSequence,
        principalAmount: String(data.principalAmount),
        interestAmount: String(data.interestAmount),
        totalRepaymentAmount: String(data.totalRepaymentAmount),
        collectionAmount: String(data.collectionAmount),
        outstandingAmount: String(data.totalRepaymentAmount),
        cycleDays: data.cycleDays,
        startDate: data.startDate,
        notes: data.notes || null,
      })
      .returning({ id: customers.id });

    await tx.insert(collectionSchedules).values({
      customerId: customer.id,
      routeId: data.routeId,
      scheduledDate: data.startDate,
      expectedAmount: String(data.collectionAmount),
      cycleNumber: 1,
      status: "pending",
    });

    return customer.id;
  });

  revalidatePath("/customers");
  redirect(`/customers/${newCustomerId}`);
}

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
      principalAmount: String(data.principalAmount),
      interestAmount: String(data.interestAmount),
      totalRepaymentAmount: String(data.totalRepaymentAmount),
      collectionAmount: String(data.collectionAmount),
      cycleDays: data.cycleDays,
      startDate: data.startDate,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.businessId, businessId), eq(customers.id, customerId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function toggleCustomerActive(customerId: string, isActive: boolean) {
  const businessId = await requireBusinessId();

  await db
    .update(customers)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(customers.businessId, businessId), eq(customers.id, customerId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}
