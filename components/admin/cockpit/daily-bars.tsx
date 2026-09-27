export interface BarPoint {
  day: string; // YYYY-MM-DD
  value: number;
  /** Tooltip text for this bar. */
  label: string;
}

const dayFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" });
export const dayLabel = (day: string) => dayFmt.format(new Date(`${day}T00:00:00Z`));

/**
 * Single-series daily bar chart: one hue, 4px rounded tops, 2px gaps,
 * tooltip per bar. A single series needs no legend — the card title names it.
 */
export function DailyBars({
  points,
  ariaLabel,
  maxLabel,
  emptyText = "Nog geen gegevens in deze periode.",
}: {
  points: BarPoint[];
  ariaLabel: string;
  maxLabel: (max: number) => string;
  emptyText?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 0);
  if (max === 0 || !points.length) {
    return <p className="text-body-md text-on-surface-variant">{emptyText}</p>;
  }
  return (
    <div>
      <div className="flex h-40 items-end gap-[2px] border-b border-outline-variant/60" role="img" aria-label={ariaLabel}>
        {points.map((p) => (
          <div key={p.day} className="group relative flex h-full flex-1 items-end" title={p.label}>
            <div
              className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
              style={{ height: `${Math.max((p.value / max) * 100, p.value > 0 ? 2 : 0)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-xs hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-inverse-surface px-sm py-[2px] text-label-sm text-inverse-on-surface group-hover:block">
              {p.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-xs flex justify-between text-label-sm text-on-surface-variant">
        <span>{dayLabel(points[0]!.day)}</span>
        <span>{maxLabel(max)}</span>
        <span>{dayLabel(points.at(-1)!.day)}</span>
      </div>
    </div>
  );
}
