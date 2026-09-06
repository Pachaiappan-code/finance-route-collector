import { Skeleton, SkeletonList } from "@/components/skeleton";

export default function DueLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <Skeleton className="h-7 w-24" />
      <SkeletonList rows={5} />
    </div>
  );
}
