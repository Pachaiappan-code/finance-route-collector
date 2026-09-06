import { Skeleton, SkeletonList } from "@/components/skeleton";

export default function CollectionsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-2 h-7 w-40" />
      </div>
      <SkeletonList rows={4} />
    </div>
  );
}
