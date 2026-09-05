import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customers, loans, routes } from "@/lib/db/schema";
import { formatDisplayDate } from "@/lib/utils/date";
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
      loanStatus: loans.status,
      principalAmount: loans.principalAmount,
      totalPayableAmount: loans.totalPayableAmount,
      monthlyAmount: loans.monthlyAmount,
      loanStartDate: loans.startDate,
      isActive: customers.isActive,
    })
    .from(customers)
    .innerJoin(routes, eq(customers.routeId, routes.id))
    .leftJoin(loans, eq(loans.customerId, customers.id))
    .where(eq(customers.businessId, session.user.businessId));

  return csvResponse(
    "customers.csv",
    rows.map((r) => ({ ...r, loanStartDate: formatDisplayDate(r.loanStartDate) })),
  );
}
