import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collectionSchedules, customers, routes } from "@/lib/db/schema";
import { csvResponse } from "@/lib/utils/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const rows = await db
    .select({
      customerCode: customers.customerCode,
      customerName: customers.name,
      route: routes.name,
      scheduledDate: collectionSchedules.scheduledDate,
      expectedAmount: collectionSchedules.expectedAmount,
      cycleNumber: collectionSchedules.cycleNumber,
      status: collectionSchedules.status,
    })
    .from(collectionSchedules)
    .innerJoin(customers, eq(collectionSchedules.customerId, customers.id))
    .innerJoin(routes, eq(collectionSchedules.routeId, routes.id))
    .where(eq(customers.businessId, session.user.businessId));

  return csvResponse("collections.csv", rows);
}
