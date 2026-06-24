import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/salon/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <Skeleton className="mb-lg h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-md">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
        <div className="flex flex-col gap-md">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}
