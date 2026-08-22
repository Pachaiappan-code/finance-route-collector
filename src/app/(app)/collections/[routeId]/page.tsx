import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getRouteById } from "@/lib/db/queries/routes";
import { getTodaysScheduleForRoute } from "@/lib/db/queries/collections";
import { toCalendarDate } from "@/lib/calculations/cycle";
import { CollectionRouteView } from "../route-view";

export default async function RouteCollectionPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const session = await auth();
  const route = await getRouteById(session!.user.businessId, routeId);
  if (!route) notFound();

  const dateStr = toCalendarDate(new Date());
  const schedules = await getTodaysScheduleForRoute(routeId, dateStr);

  return (
    <div className="flex flex-col">
      <div className="p-4 pb-0 pt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {route.name}
        </h1>
        <p className="text-sm text-muted">{dateStr}</p>
      </div>
      <CollectionRouteView schedules={schedules} />
    </div>
  );
}
