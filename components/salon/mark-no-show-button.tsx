"use client";

import { useActionState } from "react";
import { markNoShowAction } from "@/lib/payments-policy/actions";
import { Icon } from "@/components/ui/icon";

export function MarkNoShowButton({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState(markNoShowAction, undefined);

  if (state?.success) {
    return <span className="text-label-sm text-on-surface-variant">No-show geregistreerd</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 text-label-sm text-error hover:underline disabled:opacity-50"
        title="Markeer als no-show — telt mee voor het three-strikes-beleid"
      >
        <Icon name="event_busy" className="text-[16px]" />
        No-show
      </button>
      {state?.error && <p className="mt-1 text-label-sm text-error">{state.error}</p>}
    </form>
  );
}
