import { Skeleton, SkeletonList } from "@/components/skeleton";

export default function RemindersLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <Skeleton className="h-7 w-32" />
      <SkeletonList rows={4} />
    </div>
  );
}
