import { Skeleton } from "@/components/skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
