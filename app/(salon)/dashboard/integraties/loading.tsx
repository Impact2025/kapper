import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/salon/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow flex items-start gap-sm">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-xs">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-md">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        <Skeleton className="h-10 w-44 rounded-full" />
        <CardSkeleton rows={4} />
      </div>
    </div>
  );
}
