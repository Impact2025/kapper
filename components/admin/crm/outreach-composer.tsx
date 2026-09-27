"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { sendOutreachAction } from "@/lib/crm/actions";
import { fillPlaceholders, SKIP_REASON_LABELS, type SkipReason } from "@/lib/crm/outreach-template";
import { Card, Badge, EmptyState } from "@/components/admin/ui";

export interface ComposerRecipient {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  stage: string;
  emailsSent: number;
  skip: SkipReason | null;
}

const DEFAULT_SUBJECT = "Nooit meer een gemiste klant voor {{naam}}";
const DEFAULT_BODY = `Hoi {{naam}},

Ik ben Vincent van {{merk}}. Veel ondernemers in {{plaats}} missen telefoontjes en aanvragen terwijl ze aan het werk zijn. Elke gemiste oproep is een gemiste klant.

{{merk}} neemt de telefoon en WhatsApp 24/7 voor je op, plant afspraken in en stuurt herinneringen, zodat jij gewoon kunt doorwerken.

Mag ik je in een kwartier laten zien hoe dat voor {{naam}} werkt? Beantwoord deze mail gewoon, dan plannen we iets in.

Groet,
Vincent Munster
{{site}}`;

const inputClass =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary";

export function OutreachComposer({
  vertical,
  brandName,
  siteUrl,
  onlyNeverEmailed,
  maxPerSend,
  recipients,
}: {
  vertical: string;
  brandName: string;
  siteUrl: string;
  onlyNeverEmailed: boolean;
  maxPerSend: number;
  recipients: ComposerRecipient[];
}) {
  const [state, action, pending] = useActionState(sendOutreachAction, undefined);
  const eligible = recipients.filter((r) => !r.skip);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(eligible.slice(0, maxPerSend).map((r) => r.id)));
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);

  const sample = eligible.find((r) => selected.has(r.id)) ?? eligible[0];
  const preview = useMemo(() => {
    if (!sample) return null;
    const vars = { naam: sample.name, plaats: sample.city, merk: brandName, site: siteUrl };
    return { subject: fillPlaceholders(subject, vars), body: fillPlaceholders(body, vars) };
  }, [sample, subject, body, brandName, siteUrl]);

  if (!recipients.length) {
    return (
      <EmptyState
        icon="inbox"
        title="Geen leads in deze selectie"
        description="Importeer leads met npm run import:leads of kies een andere fase."
      />
    );
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxPerSend) next.add(id);
      return next;
    });
  const allOn = selected.size === Math.min(eligible.length, maxPerSend);
  const skippedCount = recipients.length - eligible.length;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const intent = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
        if (intent === "send" && !window.confirm(`${selected.size} mails versturen als ${brandName}? Dit kan niet ongedaan worden.`)) {
          e.preventDefault();
        }
      }}
      className="grid grid-cols-1 gap-md lg:grid-cols-5"
    >
      <input type="hidden" name="vertical" value={vertical} />
      <input type="hidden" name="onlyNeverEmailed" value={onlyNeverEmailed ? "1" : "0"} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="leadIds" value={id} />
      ))}

      <Card className="flex flex-col gap-sm lg:col-span-3">
        <h2 className="font-headline-md text-headline-md text-on-surface">Bericht</h2>
        <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className={inputClass} placeholder="Onderwerp" />
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={14} required className={inputClass} />
        <p className="text-label-sm text-on-surface-variant">
          Placeholders: <code>{"{{naam}}"}</code> (bedrijfsnaam), <code>{"{{plaats}}"}</code>, <code>{"{{merk}}"}</code> ({brandName}),{" "}
          <code>{"{{site}}"}</code>. Een afmeldlink wordt automatisch onderaan toegevoegd. Antwoorden komen in je eigen inbox.
        </p>

        {preview && (
          <div className="rounded-lg border border-outline-variant/40 bg-surface-container p-sm">
            <div className="mb-xs text-label-sm uppercase tracking-wide text-on-surface-variant">
              Voorbeeld voor {sample!.name}
            </div>
            <div className="text-label-md font-label-md text-on-surface">{preview.subject}</div>
            <div className="mt-xs whitespace-pre-wrap text-body-md text-on-surface-variant">{preview.body}</div>
            <div className="mt-sm text-label-sm text-outline">Liever geen berichten meer van {brandName}? Afmelden.</div>
          </div>
        )}

        {state?.message && <p className="text-label-md text-primary">{state.message}</p>}
        {state?.error && <p className="text-label-md text-error">{state.error}</p>}

        <div className="flex flex-wrap gap-sm">
          <button
            type="submit"
            name="intent"
            value="test"
            disabled={pending || !selected.size}
            className="rounded-full border-2 border-primary px-md py-xs text-label-md font-label-md text-primary transition-all hover:bg-primary/5 disabled:opacity-60"
          >
            Stuur testmail naar mij
          </button>
          <button
            type="submit"
            name="intent"
            value="send"
            disabled={pending || !selected.size}
            className="rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {pending ? "Bezig…" : `Verstuur naar ${selected.size} ${selected.size === 1 ? "lead" : "leads"}`}
          </button>
        </div>
      </Card>

      <Card className="p-0 lg:col-span-2">
        <div className="flex items-center justify-between gap-sm border-b border-outline-variant/40 px-md py-sm">
          <span className="text-label-md font-label-md text-on-surface">
            {selected.size} van {eligible.length} geselecteerd
            {skippedCount > 0 && <span className="text-on-surface-variant"> · {skippedCount} uitgesloten</span>}
          </span>
          <button
            type="button"
            onClick={() => setSelected(allOn ? new Set() : new Set(eligible.slice(0, maxPerSend).map((r) => r.id)))}
            className="text-label-sm text-primary hover:underline"
          >
            {allOn ? "Niets" : "Alles"}
          </button>
        </div>
        <ul className="max-h-[36rem] overflow-y-auto">
          {recipients.map((r) => (
            <li key={r.id} className="border-b border-outline-variant/20 px-md py-xs last:border-0">
              <label className={`flex items-start gap-sm ${r.skip ? "opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  className="mt-[3px]"
                  disabled={!!r.skip}
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                />
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/crm/${r.id}`} className="block truncate text-label-md font-label-md text-on-surface hover:text-primary">
                    {r.name}
                  </Link>
                  <span className="block truncate text-label-sm text-on-surface-variant">
                    {r.email ?? "—"}
                    {r.city ? ` · ${r.city}` : ""}
                    {r.emailsSent > 0 ? ` · ${r.emailsSent}× gemaild` : ""}
                  </span>
                </span>
                {r.skip ? <Badge tone="error">{SKIP_REASON_LABELS[r.skip]}</Badge> : <Badge>{r.stage}</Badge>}
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </form>
  );
}
