import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getRouteById } from "@/lib/db/queries/routes";
import { listCyclesForMonth } from "@/lib/db/queries/cycles";
import { currentCycleMonth } from "@/lib/calculations/cycle";
import { formatMonthLabel } from "@/lib/utils/date";
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

  const cycleMonth = currentCycleMonth();
  const cycles = await listCyclesForMonth(session!.user.businessId, cycleMonth, { routeId });

  return (
    <div className="flex flex-col">
      <div className="p-4 pb-0 pt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {route.name}
        </h1>
        <p className="text-sm text-muted">{formatMonthLabel(cycleMonth)}</p>
      </div>
      <CollectionRouteView cycles={cycles} />
    </div>
  );
}
