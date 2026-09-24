"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AttachmentPicker, type UploadedAttachment } from "@/components/support/attachment-picker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CANNED_REPLIES, fillCanned } from "@/lib/support/canned";

/**
 * Reply box. Exactly one of `token` (guest link) or `ticketId` (logged-in
 * salon / admin) identifies the ticket; the server decides the author role.
 * Admins additionally get an "interne notitie" toggle.
 */
export function TicketReplyForm({
  token,
  ticketId,
  allowInternal = false,
  customerName,
  placeholder = "Schrijf je reactie…",
}: {
  token?: string;
  ticketId?: string;
  /** Agent mode: internal-note toggle, macro's and AI-concept. */
  allowInternal?: boolean;
  customerName?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [internal, setInternal] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);

  async function draft() {
    if (!ticketId) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch("/api/support/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Concept genereren mislukt.");
      else setMessage(data.draft as string);
    } catch {
      setError("Concept genereren mislukt.");
    } finally {
      setDrafting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ticketId, message, attachments, internal: allowInternal ? internal : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Versturen mislukt.");
        return;
      }
      setMessage("");
      setAttachments([]);
      setInternal(false);
      router.refresh();
    } catch {
      setError("Versturen mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-sm rounded-xl border border-outline-variant/50 bg-white p-md">
      {error && (
        <div role="alert" className="rounded-lg bg-error-container p-sm text-label-md text-on-error-container">
          {error}
        </div>
      )}
      {allowInternal && (
        <div className="flex flex-wrap items-center gap-sm">
          <select
            aria-label="Macro invoegen"
            defaultValue=""
            onChange={(e) => {
              const m = CANNED_REPLIES.find((c) => c.id === e.target.value);
              if (m) setMessage(fillCanned(m.body, customerName ?? "klant"));
              e.target.value = "";
            }}
            className="rounded-full border border-outline-variant bg-white px-sm py-[2px] text-label-sm"
          >
            <option value="">Macro invoegen…</option>
            {CANNED_REPLIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={draft}
            disabled={drafting}
            className="inline-flex items-center gap-xs rounded-full border border-primary px-sm py-[2px] text-label-sm text-primary hover:bg-primary/5 disabled:opacity-60"
          >
            <Icon name="auto_awesome" className="text-[16px]" />
            {drafting ? "Concept schrijven…" : "AI-concept"}
          </button>
        </div>
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder={internal ? "Interne notitie — alleen zichtbaar voor het team" : placeholder}
        className={`w-full resize-y rounded-lg border px-md py-sm text-body-md outline-none focus:ring-2 focus:ring-primary/20 ${
          internal ? "border-secondary bg-secondary-fixed/30" : "border-outline-variant focus:border-primary"
        }`}
      />
      <AttachmentPicker value={attachments} onChange={setAttachments} />
      <div className="flex flex-wrap items-center justify-between gap-sm">
        {allowInternal ? (
          <label className="inline-flex items-center gap-xs text-label-md text-on-surface">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            Interne notitie (niet naar klant)
          </label>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={busy || !message.trim()}>
          {busy ? "Versturen…" : internal ? "Notitie opslaan" : "Versturen"}
        </Button>
      </div>
    </form>
  );
}
