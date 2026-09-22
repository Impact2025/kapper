import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Salon-dashboard design primitives — visually distinct from
 * components/admin/ui.tsx on purpose. Sans-serif, pill badges, overline
 * labels, generous whitespace: the "strak/clean/pro" look kappers see every
 * day. Same prop shapes as admin/ui.tsx so pages can swap the import.
 * Never used on the marketing site or in /admin.
 */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
      <div>
        {eyebrow && <div className="dash-eyebrow mb-xs">{eyebrow}</div>}
        <h1 className="dash-h1 text-headline-lg">{title}</h1>
        {subtitle && <p className="mt-xs text-body-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TINTS = {
  plain: "bg-surface-container-lowest",
  primary: "bg-primary-fixed/50",
  secondary: "bg-secondary-fixed/50",
  tertiary: "bg-tertiary-fixed/40",
} as const;

export function Card({
  children,
  className,
  tint = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  tint?: keyof typeof TINTS;
}) {
  return (
    <div className={cn(tint === "plain" ? "dash-card" : "dash-card-tint", TINTS[tint], "p-md", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tint = "plain",
}: {
  label: string;
  value: string;
  icon: string;
  hint?: string;
  tint?: keyof typeof TINTS;
}) {
  return (
    <Card tint={tint} className="flex items-start gap-sm">
      <IconTile icon={icon} tone={tint === "plain" ? "primary" : tint} />
      <div className="min-w-0">
        <div className="dash-eyebrow">{label}</div>
        <div className="stat-figure mt-xs text-headline-md text-on-surface">{value}</div>
        {hint && <div className="mt-xs text-label-sm text-on-surface-variant">{hint}</div>}
      </div>
    </Card>
  );
}

const ICON_TONES = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  tertiary: "bg-tertiary text-on-tertiary",
} as const;

/** Colored square icon chip — the Sparren-style feature-card icon. */
export function IconTile({
  icon,
  tone = "primary",
  size = 40,
}: {
  icon: string;
  tone?: keyof typeof ICON_TONES;
  size?: number;
}) {
  return (
    <div
      className={cn("dash-icon-tile", ICON_TONES[tone])}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} style={{ fontSize: Math.round(size * 0.55) }} />
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  primary: "bg-primary text-on-primary",
  success: "bg-primary-fixed text-on-primary-fixed",
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
  return <span className={cn("dash-pill", BADGE_TONES[tone])}>{children}</span>;
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
    <Card className="flex flex-col items-center gap-sm py-2xl text-center">
      <IconTile icon={icon} tone="tertiary" size={48} />
      <div className="dash-h2 text-headline-md">{title}</div>
      {description && <p className="max-w-[28rem] text-body-md text-on-surface-variant">{description}</p>}
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
        "inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95",
        className,
      )}
    >
      {children}
    </Link>
  );
}
