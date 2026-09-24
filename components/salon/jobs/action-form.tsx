"use client";

import { useActionState, useEffect, useRef } from "react";
import type { JobActionState } from "@/lib/jobs/actions";
import { Icon } from "@/components/ui/icon";
import { btnPrimary } from "@/components/salon/jobs/ui";
import { cn } from "@/lib/utils";

type Action = (prev: JobActionState | undefined, fd: FormData) => Promise<JobActionState>;

/**
 * One wrapper for every klus-CRM form: runs a server action, shows its error
 * or success message inline, optionally clears itself after success. Keeps the
 * ~25 small forms of the klus-CRM free of repeated useActionState plumbing.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  submitIcon,
  className,
  resetOnSuccess = false,
  hideSubmit = false,
  buttonClassName,
  successText,
  confirm,
}: {
  action: Action;
  /** Ask window.confirm before submitting (destructive actions). */
  confirm?: string;
  children?: React.ReactNode;
  submitLabel?: string;
  submitIcon?: string;
  className?: string;
  resetOnSuccess?: boolean;
  hideSubmit?: boolean;
  buttonClassName?: string;
  successText?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={cn("flex flex-col gap-sm", className)}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state?.error && (
        <p role="alert" className="rounded-lg bg-error-container px-sm py-xs text-label-md text-on-error-container">
          {state.error}
        </p>
      )}
      {state?.success && (state.message || successText) && (
        <p className="rounded-lg bg-primary-fixed px-sm py-xs text-label-md text-on-primary-fixed">
          {state.message ?? successText}
        </p>
      )}
      {!hideSubmit && submitLabel && (
        <div>
          <button type="submit" disabled={pending} className={buttonClassName ?? btnPrimary}>
            {submitIcon && <Icon name={submitIcon} className="text-[18px]" />}
            {pending ? "Bezig…" : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}

/** Tiny inline button-form (one hidden-field action, e.g. "Verwijder"). */
export function InlineActionButton({
  action,
  fields,
  label,
  icon,
  className,
  confirm,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  icon?: string;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      className="inline-flex flex-col"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending} className={className ?? "text-label-sm text-on-surface-variant hover:text-error"}>
        {icon && <Icon name={icon} className="mr-xs align-middle text-[16px]" />}
        {pending ? "…" : label}
      </button>
      {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
    </form>
  );
}
