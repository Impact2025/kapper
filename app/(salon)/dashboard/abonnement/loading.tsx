import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/salon/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <CardSkeleton rows={5} />
        <div className="flex flex-col gap-sm">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
      <CardSkeleton className="mt-md" rows={2} />
    </div>
  );
}
