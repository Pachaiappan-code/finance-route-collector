import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-7 w-40" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}
