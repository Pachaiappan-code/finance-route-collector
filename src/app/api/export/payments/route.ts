import { auth } from "@/lib/auth/config";
import { getReportPayments } from "@/lib/db/queries/reports";
import { formatDisplayDate } from "@/lib/utils/date";
import { csvResponse } from "@/lib/utils/csv";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "2000-01-01";
  const to = searchParams.get("to") || "2100-01-01";
  const routeId = searchParams.get("route") || undefined;
  const paymentMethod = (searchParams.get("method") as "cash" | "gpay" | null) || undefined;

  const rows = await getReportPayments(session.user.businessId, from, to, {
    routeId,
    paymentMethod,
  });

  return csvResponse(
    "payments.csv",
    rows.map((r) => ({
      customerName: r.customerName,
      route: r.routeName ?? "",
      cycleMonth: r.cycleMonth ? formatDisplayDate(r.cycleMonth) : "",
      amount: r.amount,
      paymentDate: formatDisplayDate(r.paymentDate),
      paymentMethod: r.paymentMethod,
      notes: r.notes ?? "",
    })),
  );
}
