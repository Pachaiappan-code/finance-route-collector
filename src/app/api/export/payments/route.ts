import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customers, payments } from "@/lib/db/schema";
import { csvResponse } from "@/lib/utils/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const rows = await db
    .select({
      customerCode: customers.customerCode,
      customerName: customers.name,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      paymentTime: payments.paymentTime,
      paymentMethod: payments.paymentMethod,
      notes: payments.notes,
    })
    .from(payments)
    .innerJoin(customers, eq(payments.customerId, customers.id))
    .where(eq(customers.businessId, session.user.businessId));

  return csvResponse("payments.csv", rows);
}
