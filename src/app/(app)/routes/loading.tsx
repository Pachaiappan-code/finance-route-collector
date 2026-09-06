import { Skeleton, SkeletonList } from "@/components/skeleton";

export default function RoutesLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <SkeletonList rows={3} />
    </div>
  );
}
