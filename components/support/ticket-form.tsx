"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { AttachmentPicker, type UploadedAttachment } from "@/components/support/attachment-picker";
import { TICKET_CATEGORIES } from "@/lib/support/ticket-model";

interface Suggestion {
  slug: string;
  title: string;
  summary: string;
}

const FIELD =
  "w-full rounded-lg border border-outline-variant bg-white px-md py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * One ticket form for guests (/contact) and logged-in salons (/dashboard/support).
 * For a logged-in salon the server takes name/e-mail from the session, so those
 * fields are hidden (`knownUser`). While typing the subject we show matching
 * help articles ("Bedoel je dit?") to deflect easy questions.
 */
export function TicketForm({
  knownUser = false,
  audience,
  defaultCategory,
  defaultSubject,
  chatSessionId,
}: {
  knownUser?: boolean;
  audience: "prospect" | "salon";
  defaultCategory?: string;
  defaultSubject?: string;
  chatSessionId?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [result, setResult] = useState<{ ticketNumber: string; url: string } | null>(null);

  const categories = TICKET_CATEGORIES.filter((c) => c.audience === "both" || c.audience === audience);

  const shownSuggestions = subject.trim().length >= 4 ? suggestions : [];

  useEffect(() => {
    if (subject.trim().length < 4) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/help/suggest?q=${encodeURIComponent(subject)}`);
        if (res.ok) setSuggestions((await res.json()).results ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [subject]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: knownUser ? undefined : String(fd.get("name") ?? ""),
      email: knownUser ? undefined : String(fd.get("email") ?? ""),
      subject,
      message: String(fd.get("message") ?? ""),
      category: String(fd.get("category") ?? "overig"),
      website: String(fd.get("website") ?? ""),
      attachments,
      chatSessionId,
    };
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
        setState("idle");
        return;
      }
      setResult({ ticketNumber: data.ticketNumber, url: data.url });
      setState("done");
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setState("idle");
    }
  }

  if (state === "done" && result) {
    return (
      <div className="rounded-xl bg-white p-lg text-center soft-shadow">
        <Icon name="mark_email_read" className="text-[48px] text-primary" />
        <h3 className="mkt-h3 mt-sm text-headline-md text-on-surface">Ticket {result.ticketNumber} is aangemaakt</h3>
        <p className="mt-xs text-body-md text-on-surface-variant">
          {knownUser
            ? "Je volgt de status en reacties in je dashboard."
            : "We hebben je een bevestiging met een privé-link gemaild. Via die link volg je de status en reageer je."}
        </p>
        <Link
          href={result.url}
          className="mt-md inline-flex items-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90"
        >
          Bekijk je ticket
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-md rounded-xl bg-white p-lg soft-shadow">
      {error && (
        <div role="alert" className="rounded-lg bg-error-container p-sm text-label-md text-on-error-container">
          {error}
        </div>
      )}

      {!knownUser && (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">Naam *</span>
            <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={FIELD} />
          </label>
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">E-mail *</span>
            <input name="email" type="email" required maxLength={200} autoComplete="email" className={FIELD} />
          </label>
        </div>
      )}

      <label className="block">
        <span className="mb-xs block text-label-md font-label-md">Waar gaat het over? *</span>
        <select name="category" defaultValue={defaultCategory ?? (audience === "prospect" ? "vraag_vooraf" : "technisch")} className={FIELD}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-xs block text-label-md font-label-md">Onderwerp *</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          minLength={3}
          maxLength={200}
          className={FIELD}
          placeholder="Vat je vraag kort samen"
        />
      </label>

      {shownSuggestions.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary-fixed/30 p-sm">
          <p className="mb-xs text-label-md font-label-md text-on-surface">Bedoel je een van deze vragen?</p>
          <ul className="space-y-xs">
            {shownSuggestions.map((s) => (
              <li key={s.slug}>
                <Link href={`/help/${s.slug}`} target="_blank" className="text-label-md text-primary hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="block">
        <span className="mb-xs block text-label-md font-label-md">Bericht *</span>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          className={`${FIELD} resize-y`}
          placeholder="Wat wilde je bereiken, wat gebeurde er en sinds wanneer? Deel nooit wachtwoorden of API-sleutels."
        />
      </label>

      <AttachmentPicker value={attachments} onChange={setAttachments} />

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full rounded-lg" disabled={state === "loading"}>
        {state === "loading" ? "Versturen…" : "Ticket aanmaken"}
      </Button>
      <p className="text-center text-label-sm text-on-surface-variant">
        Je gegevens gebruiken we alleen om je vraag te beantwoorden — zie onze <Link href="/privacy" className="underline">privacyverklaring</Link>.
      </p>
    </form>
  );
}
