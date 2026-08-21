import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customers, routes } from "@/lib/db/schema";
import { csvResponse } from "@/lib/utils/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const rows = await db
    .select({
      customerCode: customers.customerCode,
      name: customers.name,
      phone: customers.phone,
      area: customers.area,
      route: routes.name,
      principalAmount: customers.principalAmount,
      totalRepaymentAmount: customers.totalRepaymentAmount,
      outstandingAmount: customers.outstandingAmount,
      cycleDays: customers.cycleDays,
      isActive: customers.isActive,
    })
    .from(customers)
    .innerJoin(routes, eq(customers.routeId, routes.id))
    .where(eq(customers.businessId, session.user.businessId));

  return csvResponse("customers.csv", rows);
}
