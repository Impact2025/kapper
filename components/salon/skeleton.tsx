import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-surface-container-high", className)} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
      <div className="flex items-start gap-sm">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-xs">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow",
        className,
      )}
    >
      <Skeleton className="mb-md h-5 w-40" />
      <div className="flex flex-col gap-sm">
        {Array.from({ length: rows }).map((_, i) => {
          const widths = ["w-4/5", "w-3/4", "w-full", "w-2/3", "w-5/6"];
          return <Skeleton key={i} className={`h-4 ${widths[i % widths.length]}`} />;
        })}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
      <div className="space-y-xs">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}
