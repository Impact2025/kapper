"use client";

import { useEffect, useRef, useState } from "react";

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

const SLUG = "elixir-atelier";
const SALON_NAME = "Élixir Atelier";

const SUGGESTIONS = [
  "Ik wil een Signature Haircut boeken in Amsterdam",
  "Wat houdt de Botanical Glossing precies in?",
  "Kan ik mijn afspraak verzetten? Mijn nummer is 0611223344",
];

function sessionKey() {
  return `elixir-chat-session`;
}
function newSessionId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function ElixirChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const key = sessionKey();
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
  }, [messages, pending, open]);

  function resetConversation() {
    const id = newSessionId();
    sessionStorage.setItem(sessionKey(), id);
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
        body: JSON.stringify({ slug: SLUG, sessionId, message: trimmed }),
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
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {open && (
        <div className="flex h-[75vh] max-h-[600px] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-[#1b1c1a]/[0.08] bg-white shadow-[0_24px_60px_-12px_rgba(28,24,21,0.28)]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#1b1c1a]/[0.07] bg-[#1b1c1a] px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C5A880] to-[#B6976F] font-serif text-sm italic text-white">É</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[13.5px] font-semibold text-white">{SALON_NAME}</p>
              <p className="flex items-center gap-1.5 font-sans text-[11px] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C5A880]"></span>
                AI-receptioniste
              </p>
            </div>
            <button onClick={resetConversation} aria-label="Nieuw gesprek" title="Nieuw gesprek" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
              <span className="material-symbols-outlined !text-[18px]">refresh</span>
            </button>
            <button onClick={() => setOpen(false)} aria-label="Sluiten" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
              <span className="material-symbols-outlined !text-[18px]">close</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={logRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[#fbf9f5] px-4 py-4">
            {messages.length === 0 && (
              <div className="mb-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 font-sans text-[13.5px] leading-relaxed text-[#1b1c1a] shadow-sm">
                Bonjour — welkom bij {SALON_NAME}. Ik help u graag met het boeken, verzetten of
                annuleren van een afspraak, of met vragen over onze behandelingen. Waarmee kan ik u
                van dienst zijn?
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed shadow-sm ${
                    msg.role === "assistant"
                      ? "rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[#1b1c1a]"
                      : "rounded-2xl rounded-tr-sm bg-[#1b1c1a] px-4 py-3 text-white"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 font-sans text-[13px] text-[#4d4540] shadow-sm">Typt…</div>
              </div>
            )}
            {booked && (
              <div className="flex items-start gap-2 rounded-2xl border border-[#C5A880]/40 bg-[#fedeb2]/50 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 !text-[18px] text-[#725b38]">event_available</span>
                <p className="font-sans text-[12.5px] leading-relaxed text-[#1b1c1a]">
                  <strong>Afspraak bevestigd:</strong> {booked.treatment} op {booked.date} om {booked.time}
                </p>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[#1b1c1a]/[0.06] bg-white px-3 py-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-[#1b1c1a]/[0.1] px-3 py-1.5 font-sans text-[11.5px] text-[#4d4540] hover:border-[#725b38] hover:text-[#725b38]"
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
            className="flex items-center gap-2 border-t border-[#1b1c1a]/[0.07] bg-white px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Typ uw bericht…"
              disabled={pending || !sessionId}
              className="flex-1 rounded-full border border-[#1b1c1a]/[0.1] bg-[#fbf9f5] px-4 py-2.5 font-sans text-[13.5px] text-[#1b1c1a] outline-none focus:border-[#725b38] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !sessionId || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C5A880] to-[#B6976F] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Verstuur"
            >
              <span className="material-symbols-outlined !text-[18px]">north_east</span>
            </button>
          </form>
          <p className="bg-white px-4 pb-3 text-center font-sans text-[10.5px] text-[#4d4540]/70">
            Live demo — berichten zijn zichtbaar in het salon-dashboard.
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Sluit chat" : "Open chat met Élixir Atelier"}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1b1c1a] text-white shadow-[0_16px_32px_-8px_rgba(28,24,21,0.4)] transition-transform hover:scale-105"
      >
        <span className="material-symbols-outlined !text-[26px]">{open ? "close" : "forum"}</span>
      </button>
    </div>
  );
}
