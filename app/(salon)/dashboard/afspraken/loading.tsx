import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/salon/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-md">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
          <div className="mb-md flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <div className="flex flex-col divide-y divide-outline-variant/30">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-md py-sm">
                <Skeleton className="h-4 w-12 shrink-0" />
                <div className="flex-1 space-y-xs">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <CardSkeleton rows={3} />
      </div>
    </div>
  );
}
