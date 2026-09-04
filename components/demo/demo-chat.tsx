"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BookedInfo {
  treatment: string;
  date: string;
  time: string;
}

const SUGGESTIONS = [
  "Ik wil een afspraak voor een chemisch peeling in Den Bosch",
  "Ik heb last van pigmentvlekken, wat raden jullie aan?",
  "Kan ik mijn afspraak verzetten? Mijn telefoonnummer is 0612345678",
  "Is dit een echt persoon of praat ik met een AI?",
];

function sessionKey(slug: string) {
  return `demo-chat-session-${slug}`;
}

function newSessionId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function DemoChat({
  slug,
  salonName,
  salonCity,
}: {
  slug: string;
  salonName: string;
  salonCity: string | null;
}) {
  // Lazy initializer (not an effect): reads/writes sessionStorage exactly
  // once, on the client's own first render, with no cascading re-render.
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const key = sessionKey(slug);
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = newSessionId();
    sessionStorage.setItem(key, id);
    return id;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [booked, setBooked] = useState<BookedInfo | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function resetConversation() {
    const id = newSessionId();
    sessionStorage.setItem(sessionKey(slug), id);
    setSessionId(id);
    setMessages([]);
    setBooked(null);
    setInput("");
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending || !sessionId) return;

    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, sessionId, message: trimmed }),
      });
      const data = await res.json();
      const reply = data.reply || "Er ging iets mis — probeer het nog eens.";
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      if (data.booked) setBooked(data.booked);
    } catch {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "Er ging iets mis — probeer het nog eens." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-margin-mobile py-lg md:px-0">
      <div className="mb-md flex items-center gap-sm">
        <Link href="/" className="text-label-sm text-on-surface-variant hover:text-primary">
          ← KapperAssistent.nl
        </Link>
        <span className="ml-auto rounded-full border border-outline-variant bg-surface px-sm py-[2px] text-label-sm text-on-surface-variant">
          Live demo — geen echte klantgegevens
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface soft-shadow">
        {/* Header */}
        <div className="flex items-center gap-sm border-b border-outline-variant/40 px-md py-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-headline-md text-headline-md text-on-primary-fixed">
            {salonName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-body-md font-medium text-on-surface">{salonName}</div>
            <div className="flex items-center gap-xs text-label-sm text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary" />
              AI-receptioniste{salonCity ? ` · ${salonCity}` : ""}
            </div>
          </div>
          <button
            onClick={resetConversation}
            className="ml-auto inline-flex items-center gap-xs rounded-full border border-outline-variant px-sm py-xs text-label-sm text-on-surface-variant hover:border-primary hover:text-primary"
          >
            <Icon name="refresh" className="text-[16px]" />
            Nieuw gesprek
          </button>
        </div>

        {/* Messages */}
        <div ref={logRef} className="flex flex-1 flex-col gap-sm overflow-y-auto px-md py-md">
          {messages.length === 0 && (
            <div className="mb-sm rounded-xl bg-surface-container px-md py-sm text-body-md text-on-surface">
              Hoi! Ik ben de AI-receptioniste van {salonName}. Ik kan je helpen met het inplannen,
              verzetten of annuleren van een afspraak, en met vragen over onze behandelingen. Waar
              kan ik je mee helpen?
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-md py-sm text-body-md leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant" ? "bg-surface-container text-on-surface" : "bg-primary text-on-primary"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-surface-container px-md py-sm text-body-md text-on-surface-variant">
                Typt…
              </div>
            </div>
          )}
          {booked && (
            <div className="flex items-center gap-sm rounded-xl border border-primary/30 bg-primary-fixed/30 px-md py-sm text-label-md text-on-surface">
              <Icon name="event_available" className="text-[20px] text-primary" />
              <span>
                <strong>Afspraak geboekt:</strong> {booked.treatment} op {booked.date} om {booked.time}
              </span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-xs border-t border-outline-variant/40 px-md py-sm">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-outline-variant px-sm py-xs text-label-sm text-on-surface-variant hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-sm border-t border-outline-variant/40 px-md py-sm"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Typ een bericht, zoals je ook zou appen…"
            disabled={pending || !sessionId}
            className="flex-1 rounded-full border border-outline-variant bg-surface px-md py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || !sessionId || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Verstuur"
          >
            <Icon name="send" className="text-[18px]" />
          </button>
        </form>
      </div>

      <p className="mt-md text-center text-label-sm text-on-surface-variant">
        Dit is precies wat een klant van {salonName} via WhatsApp zou zien — elk bericht en elke
        boeking hierboven is direct zichtbaar in het salon-dashboard onder{" "}
        <strong>Gesprekken</strong> en <strong>Afspraken</strong>.{" "}
        <Link href="/login" className="text-primary hover:underline">
          Bekijk het salon-dashboard →
        </Link>
      </p>
    </div>
  );
}
