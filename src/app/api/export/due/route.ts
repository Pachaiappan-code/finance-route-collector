import { auth } from "@/lib/auth/config";
import { listDueCustomers } from "@/lib/db/queries/due";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatDisplayDate, formatDisplayTime } from "@/lib/utils/date";
import { csvResponse } from "@/lib/utils/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const due = await listDueCustomers(session.user.businessId, currentCycleMonth());
  const rows = due.map((d) => ({
    customerName: d.customerName,
    phone: d.customerPhone,
    route: d.routeName,
    expectedAmount: d.expectedAmount,
    paidAmount: d.paidAmount,
    remaining: d.remaining,
    status: d.status,
    promisedDate: d.promise ? formatDisplayDate(d.promise.promisedDate) : "",
    promisedTime: d.promise?.promisedTime ? formatDisplayTime(d.promise.promisedTime) : "",
  }));

  return csvResponse("due.csv", rows);
}
