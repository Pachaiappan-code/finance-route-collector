import { auth } from "@/lib/auth/config";
import { listDueCustomers } from "@/lib/db/queries/due";
import { csvResponse } from "@/lib/utils/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const due = await listDueCustomers(session.user.businessId);
  const rows = due.map((d) => ({
    customerName: d.customerName,
    phone: d.customerPhone,
    route: d.routeName,
    scheduledDate: d.scheduledDate,
    expectedAmount: d.expectedAmount,
    status: d.status,
    overdueDays: d.overdueDays,
    promisedDate: d.promise?.promisedDate ?? "",
    promisedTime: d.promise?.promisedTime ?? "",
  }));

  return csvResponse("due.csv", rows);
}
