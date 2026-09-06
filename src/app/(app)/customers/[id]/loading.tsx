import { Skeleton } from "@/components/skeleton";

export default function CustomerDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
