import Link from "next/link";
import { Badge } from "@/components/salon/dash-ui";
import {
  JOB_PRIORITY_LABEL,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  type JobPriority,
  type JobStatus,
} from "@/lib/jobs/model";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";
export const labelCls = "mb-xs block text-label-sm text-on-surface-variant";
export const btnPrimary =
  "inline-flex items-center justify-center gap-xs rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50";
export const btnOutline =
  "inline-flex items-center justify-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-label-md text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-xs rounded-full border border-error/40 px-md py-xs text-label-md font-label-md text-error transition-colors hover:bg-error-container disabled:opacity-50";

const TONE_TO_BADGE = {
  primary: "success",
  secondary: "warning",
  tertiary: "primary",
  neutral: "neutral",
  error: "error",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const s = status as JobStatus;
  const label = JOB_STATUS_LABEL[s] ?? status;
  const tone = TONE_TO_BADGE[JOB_STATUS_TONE[s] ?? "neutral"];
  return <Badge tone={tone}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal") return null;
  const p = priority as JobPriority;
  return <Badge tone={p === "urgent" ? "error" : p === "high" ? "warning" : "neutral"}>{JOB_PRIORITY_LABEL[p] ?? priority}</Badge>;
}

const DATE = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short", year: "numeric" });
const DATETIME = new Intl.DateTimeFormat("nl-NL", {
  timeZone: "Europe/Amsterdam",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const TIME = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" });

export const fmtDate = (d: Date | null | undefined) => (d ? DATE.format(d) : "—");
export const fmtDateTime = (d: Date | null | undefined) => (d ? DATETIME.format(d) : "—");
export const fmtTime = (d: Date | null | undefined) => (d ? TIME.format(d) : "—");

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-xs text-label-sm text-on-surface-variant">{hint}</p>}
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-primary hover:underline", className)}>
      {children}
    </Link>
  );
}

/** Tab strip made of links (server-rendered, ?tab=…). */
export function LinkTabs({ tabs, active }: { tabs: { href: string; label: string; count?: number; key: string }[]; active: string }) {
  return (
    <div className="mb-md flex flex-wrap gap-xs border-b border-outline-variant/30">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "-mb-px border-b-2 px-sm py-xs text-label-md font-label-md transition-colors",
            t.key === active ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-xs text-label-sm text-on-surface-variant">({t.count})</span>}
        </Link>
      ))}
    </div>
  );
}
