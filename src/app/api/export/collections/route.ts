import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collectionCycles, customers, routes } from "@/lib/db/schema";
import { formatDisplayDate } from "@/lib/utils/date";
import { csvResponse } from "@/lib/utils/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const rows = await db
    .select({
      customerCode: customers.customerCode,
      customerName: customers.name,
      route: routes.name,
      cycleMonth: collectionCycles.cycleMonth,
      expectedAmount: collectionCycles.expectedAmount,
      paidAmount: collectionCycles.paidAmount,
      status: collectionCycles.status,
    })
    .from(collectionCycles)
    .innerJoin(customers, eq(collectionCycles.customerId, customers.id))
    .innerJoin(routes, eq(collectionCycles.routeId, routes.id))
    .where(eq(customers.businessId, session.user.businessId));

  return csvResponse(
    "collections.csv",
    rows.map((r) => ({ ...r, cycleMonth: formatDisplayDate(r.cycleMonth) })),
  );
}
