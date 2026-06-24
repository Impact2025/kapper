import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
        {subtitle && (
          <p className="mt-xs text-body-md text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: string;
  hint?: string;
}) {
  return (
    <Card className="flex items-start gap-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="min-w-0">
        <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">
          {label}
        </div>
        <div className="font-headline-md text-headline-md text-on-surface">{value}</div>
        {hint && <div className="text-label-sm text-on-surface-variant">{hint}</div>}
      </div>
    </Card>
  );
}

const BADGE_TONES = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  primary: "bg-primary-fixed text-on-primary-fixed",
  success: "bg-primary-fixed-dim text-on-primary-fixed",
  warning: "bg-secondary-fixed text-on-secondary-fixed",
  error: "bg-error-container text-on-error-container",
} as const;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof BADGE_TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-sm py-[2px] text-label-sm font-label-sm",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-sm py-xl text-center">
      <Icon name={icon} className="text-[40px] text-outline" />
      <div className="font-headline-md text-headline-md text-on-surface">{title}</div>
      {description && (
        <p className="max-w-[28rem] text-body-md text-on-surface-variant">{description}</p>
      )}
      {action}
    </Card>
  );
}

export function AdminLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow",
        className,
      )}
    >
      {children}
    </Link>
  );
}
