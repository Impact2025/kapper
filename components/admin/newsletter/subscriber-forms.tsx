"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addSubscriberAction, importCustomersAction } from "@/lib/newsletter/actions";
import { Icon } from "@/components/ui/icon";

const inputCls = "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md outline-none focus:border-primary";

export function AddSubscriberForm({ verticals }: { verticals: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(addSubscriberAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 gap-sm md:grid-cols-2">
      <input name="email" type="email" required placeholder="E-mailadres" className={inputCls} />
      <input name="name" placeholder="Naam (optioneel)" className={inputCls} />
      <select name="vertical" className={inputCls} defaultValue="">
        <option value="">Vak (optioneel)</option>
        {verticals.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
      <input name="tags" placeholder="Tags, komma-gescheiden (optioneel)" className={inputCls} />
      <input
        name="consentSource"
        required
        minLength={5}
        placeholder="Bewijs van toestemming — bijv. beurs Kappersvak 2026, formulier getekend"
        className={`${inputCls} md:col-span-2`}
      />
      <div className="flex items-center gap-sm md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {pending ? "Toevoegen…" : "Toevoegen"}
        </button>
        {state?.error && <span className="text-label-md text-error">{state.error}</span>}
        {state?.message && <span className="text-label-md text-primary">{state.message}</span>}
      </div>
    </form>
  );
}

export function ImportCustomersButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Alle huidige klanten (salon-eigenaren) toevoegen op basis van soft opt-in? Wie zich eerder afmeldde, wordt overgeslagen.")) return;
          start(async () => setMessage((await importCustomersAction()).message ?? null));
        }}
        className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-label-md text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        <Icon name="group_add" className="text-[18px]" /> {pending ? "Importeren…" : "Klanten importeren"}
      </button>
      {message && <span className="text-label-md text-primary">{message}</span>}
    </div>
  );
}
