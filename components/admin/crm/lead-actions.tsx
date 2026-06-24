"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateLeadStage, addNote, sendLeadEmail } from "@/lib/crm/actions";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/crm/constants";

export function StageSelect({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const [state, action, pending] = useActionState(updateLeadStage, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={action} ref={formRef} className="flex items-center gap-xs">
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="stage"
        defaultValue={stage}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md font-label-md outline-none focus:border-primary disabled:opacity-60"
      >
        {LEAD_STAGES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      {pending && <span className="text-label-sm text-on-surface-variant">opslaan…</span>}
      {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
    </form>
  );
}

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(addNote, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-sm">
      <input type="hidden" name="leadId" value={leadId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Voeg een notitie toe…"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
      />
      {state?.error && <p className="text-label-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
      >
        {pending ? "Opslaan…" : "Notitie opslaan"}
      </button>
    </form>
  );
}

export function EmailForm({
  leadId,
  defaultTo,
}: {
  leadId: string;
  defaultTo: string;
}) {
  const [state, action, pending] = useActionState(sendLeadEmail, undefined);
  const [open, setOpen] = useState(false);

  const sent = state?.ok && !state.error;

  if (!open) {
    return (
      <div className="flex flex-col gap-xs">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-base self-start rounded-full border-2 border-primary px-md py-xs text-label-md font-label-md text-primary transition-all hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          E-mail sturen
        </button>
        {sent && <span className="text-label-sm text-primary">E-mail verzonden ✓</span>}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-sm">
      <input type="hidden" name="leadId" value={leadId} />
      <input
        type="email"
        name="to"
        defaultValue={defaultTo}
        required
        placeholder="Aan"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
      />
      <input
        type="text"
        name="subject"
        required
        placeholder="Onderwerp"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
      />
      <textarea
        name="body"
        rows={6}
        required
        placeholder="Bericht…"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
      />
      {state?.error && (
        <p className={state.ok ? "text-label-sm text-on-surface-variant" : "text-label-sm text-error"}>
          {state.error}
        </p>
      )}
      {sent && <p className="text-label-sm text-primary">E-mail verzonden ✓</p>}
      <div className="flex gap-sm">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {pending ? "Versturen…" : "Verstuur e-mail"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-md py-xs text-label-md font-label-md text-on-surface-variant hover:bg-surface-container"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
