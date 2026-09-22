"use client";

import { useActionState, useState } from "react";
import { purgeCustomerAction } from "@/lib/compliance/actions";
import { Icon } from "@/components/ui/icon";

export function PurgeCustomerButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [state, action, pending] = useActionState(purgeCustomerAction, undefined);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-xs text-label-md text-error hover:underline"
      >
        <Icon name="delete_forever" className="text-[18px]" />
        Alle gegevens verwijderen (AVG)
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-sm rounded-lg border border-error/40 bg-error-container/30 p-sm">
      <input type="hidden" name="customerId" value={customerId} />
      <p className="text-body-md text-on-error-container">
        Dit verwijdert <strong>{customerName}</strong> onherroepelijk: klantgegevens, gesprekken, behandelkaarten,
        gezondheidsgegevens en foto&apos;s. Afspraken en bonnen blijven bestaan voor de boekhouding, maar worden
        geanonimiseerd. Dit kan niet ongedaan gemaakt worden.
      </p>
      <label className="flex cursor-pointer items-start gap-sm">
        <input
          type="checkbox"
          name="confirmed"
          value="true"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-outline-variant accent-error"
        />
        <span className="text-label-sm text-on-error-container">
          Ik begrijp dat dit permanent is en bevestig het verwijderverzoek van deze klant.
        </span>
      </label>
      <div className="flex items-center gap-sm">
        <button
          type="submit"
          disabled={!confirmed || pending}
          className="inline-flex items-center gap-base rounded-full bg-error px-md py-xs text-label-md font-label-md text-on-error transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Icon name={pending ? "refresh" : "delete_forever"} className={`text-[18px] ${pending ? "animate-spin" : ""}`} />
          Definitief verwijderen
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmed(false);
          }}
          className="text-label-md text-on-surface-variant hover:underline"
        >
          Annuleren
        </button>
      </div>
      {state?.error && <p className="text-label-sm text-error">{state.error}</p>}
    </form>
  );
}
