"use client";

import { useActionState } from "react";
import { markConversationHandledAction } from "@/lib/salon/escalaties-actions";
import { Icon } from "@/components/ui/icon";

export function MarkHandledButton({ conversationId }: { conversationId: string }) {
  const [state, action, pending] = useActionState(markConversationHandledAction, undefined);

  if (state?.success) {
    return <span className="text-label-sm text-on-surface-variant">Opgepakt</span>;
  }

  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <button
        type="submit"
        disabled={pending}
        className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-sm py-xs text-label-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
      >
        <Icon name="check" className="text-[16px]" />
        Overgenomen
      </button>
      {state?.error && <p className="mt-1 text-label-sm text-error">{state.error}</p>}
    </form>
  );
}
