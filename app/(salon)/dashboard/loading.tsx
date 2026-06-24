import { PageHeaderSkeleton, StatCardSkeleton, CardSkeleton, Skeleton } from "@/components/salon/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />

      {/* Onboarding skeleton */}
      <div className="mb-lg rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
        <div className="mb-sm flex items-center gap-sm">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-col gap-xs">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-sm">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-2">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  );
}
