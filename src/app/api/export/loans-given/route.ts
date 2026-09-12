import { auth } from "@/lib/auth/config";
import { getReportDisbursements } from "@/lib/db/queries/reports";
import { formatDisplayDate } from "@/lib/utils/date";
import { csvResponse } from "@/lib/utils/csv";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "2000-01-01";
  const to = searchParams.get("to") || "2100-01-01";
  const routeId = searchParams.get("route") || undefined;

  const rows = await getReportDisbursements(session.user.businessId, from, to, { routeId });

  return csvResponse(
    "loans-given.csv",
    rows.map((r) => ({
      customerName: r.customerName,
      route: r.routeName ?? "",
      principalAmount: r.principalAmount,
      interestAmount: r.interestAmount,
      totalPayableAmount: r.totalPayableAmount,
      numberOfMonths: r.numberOfMonths ?? "",
      startDate: formatDisplayDate(r.startDate),
    })),
  );
}
