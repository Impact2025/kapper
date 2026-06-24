import { PageHeaderSkeleton, StatCardSkeleton, CardSkeleton } from "@/components/salon/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
        {[0, 1, 2].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="mb-lg grid grid-cols-1 gap-md md:grid-cols-2">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={3} />
      </div>
      <CardSkeleton rows={5} />
    </div>
  );
}
