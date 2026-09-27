"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/**
 * Public newsletter sign-up → double opt-in. Deliberately shows the same
 * "check je inbox" for new, existing and re-subscribing addresses.
 */
export function NewsletterSignup({ vertical, title, subtitle }: { vertical: string; title?: string; subtitle?: string }) {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name"),
          website: form.get("website"),
          vertical,
          page: pathname,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Aanmelden lukte niet.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmelden lukte niet.");
      setState("error");
    }
  }

  return (
    <aside className="mx-auto mt-xl max-w-2xl rounded-xl border border-outline-variant/60 bg-surface-container-low p-md md:p-lg" aria-label="Nieuwsbrief">
      {state === "done" ? (
        <div className="flex items-start gap-sm" role="status">
          <Icon name="mark_email_unread" className="text-[28px] text-primary" />
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">Check je inbox</p>
            <p className="text-body-md text-on-surface-variant">We hebben je een mail gestuurd. Klik op de knop daarin om je aanmelding te bevestigen.</p>
          </div>
        </div>
      ) : (
        <>
          <p className="font-headline-md text-headline-md text-on-surface">{title ?? "Eén keer per maand praktische tips"}</p>
          <p className="mt-xs text-body-md text-on-surface-variant">
            {subtitle ?? "Nieuwe artikelen, slimme ideeën en wat er verandert in je vak. Geen spam, afmelden met één klik."}
          </p>
          <form onSubmit={onSubmit} className="mt-sm flex flex-col gap-xs sm:flex-row">
            <label className="sr-only" htmlFor="nl-name">
              Voornaam
            </label>
            <input id="nl-name" name="name" autoComplete="given-name" placeholder="Voornaam" className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-body-md outline-none focus:border-primary sm:w-40" />
            <label className="sr-only" htmlFor="nl-email">
              E-mailadres
            </label>
            <input
              id="nl-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jouw@email.nl"
              className="flex-1 rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-body-md outline-none focus:border-primary"
            />
            {/* Honeypot — hidden from people, tempting for bots. */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button
              type="submit"
              disabled={state === "sending"}
              className="rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {state === "sending" ? "Aanmelden…" : "Aanmelden"}
            </button>
          </form>
          {error && <p className="mt-xs text-label-md text-error">{error}</p>}
          <p className="mt-xs text-label-sm text-on-surface-variant">
            Je krijgt eerst een bevestigingsmail. Lees in onze <a href="/privacy" className="underline hover:text-primary">privacyverklaring</a> hoe we met je gegevens omgaan.
          </p>
        </>
      )}
    </aside>
  );
}
