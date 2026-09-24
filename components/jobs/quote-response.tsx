"use client";

import { useActionState, useState } from "react";
import { acceptQuoteAction, declineQuoteAction } from "@/lib/jobs/public-actions";

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

export function QuoteResponse({ token }: { token: string }) {
  const [acceptState, accept, acceptPending] = useActionState(acceptQuoteAction, undefined);
  const [declineState, decline, declinePending] = useActionState(declineQuoteAction, undefined);
  const [showDecline, setShowDecline] = useState(false);

  const done = acceptState?.success ? acceptState.message : declineState?.success ? declineState.message : null;
  if (done) {
    return <p className="rounded-xl bg-primary-fixed p-md text-body-md text-on-primary-fixed print:hidden">{done}</p>;
  }

  return (
    <div className="flex flex-col gap-md rounded-xl border border-outline-variant/40 bg-white p-md print:hidden">
      <form action={accept} className="flex flex-col gap-sm">
        <input type="hidden" name="token" value={token} />
        <h2 className="text-headline-md font-label-md">Akkoord met deze offerte?</h2>
        <input name="name" required minLength={2} placeholder="Je volledige naam" className={inputCls} autoComplete="name" />
        <label className="flex items-start gap-sm text-label-md text-on-surface">
          <input type="checkbox" name="agree" className="mt-[3px]" />
          Ik ga akkoord met deze offerte en de genoemde voorwaarden.
        </label>
        {acceptState?.error && <p className="text-label-md text-error">{acceptState.error}</p>}
        <button type="submit" disabled={acceptPending} className="self-start rounded-full bg-primary px-lg py-sm text-label-md font-label-md text-on-primary hover:opacity-90 disabled:opacity-50">
          {acceptPending ? "Bezig…" : "Offerte accepteren"}
        </button>
      </form>

      {showDecline ? (
        <form action={decline} className="flex flex-col gap-sm border-t border-outline-variant/30 pt-md">
          <input type="hidden" name="token" value={token} />
          <textarea name="reason" rows={2} placeholder="Wil je laten weten waarom? (optioneel)" className={inputCls} />
          {declineState?.error && <p className="text-label-md text-error">{declineState.error}</p>}
          <button type="submit" disabled={declinePending} className="self-start rounded-full border border-error/40 px-md py-xs text-label-md text-error hover:bg-error-container disabled:opacity-50">
            {declinePending ? "Bezig…" : "Offerte afwijzen"}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setShowDecline(true)} className="self-start text-label-md text-on-surface-variant hover:text-error">
          Niet akkoord? Wijs de offerte af
        </button>
      )}
    </div>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface hover:bg-surface-container print:hidden">
      Afdrukken / opslaan als PDF
    </button>
  );
}
