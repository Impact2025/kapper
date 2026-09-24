"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { renderMarkdown } from "@/lib/blog/markdown";
import { SUPPORT_GREETING } from "@/lib/support/chat-guard";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id?: string | null;
  role: "user" | "assistant";
  content: string;
  sources?: { slug: string; title: string }[];
  helpful?: boolean | null;
}

interface StoredChat {
  sessionId: string;
  audience: "prospect" | "salon";
  messages: ChatMessage[];
}

const STORAGE_KEY = "ka-support-chat-v1";

const STARTERS: Record<"prospect" | "salon", string[]> = {
  prospect: ["Wat kost KapperAssistent?", "Hoe start ik met de proefperiode?", "Welke agenda-software wordt ondersteund?"],
  salon: ["Wat is mijn huidige plan?", "Mijn agenda-koppeling werkt niet", "Wat is de status van mijn tickets?"],
};

function newSessionId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }
}

const EMPTY_CHAT: StoredChat = { sessionId: "", audience: "prospect", messages: [] };

// External store over localStorage (with an in-memory fallback for private mode /
// blocked storage) so the widget hydrates without setState-in-effect.
let memoryRaw: string | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): string | null {
  if (memoryRaw != null) return memoryRaw;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): StoredChat {
  if (!raw) return EMPTY_CHAT;
  try {
    return JSON.parse(raw) as StoredChat;
  } catch {
    return EMPTY_CHAT;
  }
}

function save(chat: StoredChat) {
  const raw = JSON.stringify(chat);
  memoryRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage blocked: the in-memory copy keeps the chat alive for this page view.
  }
  listeners.forEach((l) => l());
}

interface TicketOffer {
  category: string;
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const chat = useMemo(() => parse(raw), [raw]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<TicketOffer | null>(null);
  const [ticket, setTicket] = useState<{ number: string; url: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("support-chat:open", onOpen);
    return () => window.removeEventListener("support-chat:open", onOpen);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chat.messages, busy, offer, ticket, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const update = useCallback((next: StoredChat) => save(next), []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setError(null);
    setInput("");
    const base: StoredChat = chat.sessionId ? chat : { ...chat, sessionId: newSessionId() };
    const withUser: StoredChat = { ...base, messages: [...base.messages, { role: "user", content: message }] };
    update(withUser);
    setBusy(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: withUser.sessionId, message, pagePath: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        // Chat belonged to another (logged-in) account: start a fresh one.
        update({ sessionId: newSessionId(), audience: "prospect", messages: [] });
        setError("Dit gesprek hoorde bij een ander account. Stel je vraag opnieuw.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
        return;
      }
      update({
        ...withUser,
        audience: data.audience ?? withUser.audience,
        messages: [...withUser.messages, { id: data.messageId, role: "assistant", content: data.reply, sources: data.sources ?? [] }],
      });
      if (data.suggestTicket) setOffer({ category: data.suggestedCategory ?? "overig" });
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function rate(index: number, helpful: boolean) {
    const m = chat.messages[index];
    if (!m?.id || m.helpful != null) return;
    const messages = chat.messages.map((x, i) => (i === index ? { ...x, helpful } : x));
    update({ ...chat, messages });
    fetch("/api/support/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: chat.sessionId, messageId: m.id, helpful }),
    }).catch(() => {});
    if (!helpful) setOffer((o) => o ?? { category: "overig" });
  }

  function reset() {
    update({ sessionId: newSessionId(), audience: chat.audience, messages: [] });
    setOffer(null);
    setTicket(null);
    setError(null);
  }

  const lastUser = [...chat.messages].reverse().find((m) => m.role === "user")?.content ?? "";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open hulp en AI-assistent"
          className="fixed bottom-md right-md z-[60] flex items-center gap-xs rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95"
        >
          <Icon name="smart_toy" className="text-[22px]" />
          <span className="hidden sm:inline">Hulp nodig?</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="AI-assistent van KapperAssistent"
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[min(640px,100dvh)] flex-col overflow-hidden rounded-t-2xl border border-outline-variant/50 bg-surface shadow-2xl sm:inset-x-auto sm:bottom-md sm:right-md sm:h-[min(640px,calc(100dvh-2rem))] sm:w-[400px] sm:rounded-2xl"
        >
          <header className="flex items-center justify-between gap-sm bg-primary px-md py-sm text-on-primary">
            <div className="flex items-center gap-sm">
              <Icon name="smart_toy" className="text-[24px]" />
              <div>
                <div className="text-label-md font-label-md">KapperAssistent Support</div>
                <div className="text-label-sm opacity-80">AI-assistent · antwoorden uit het hulpcentrum</div>
              </div>
            </div>
            <div className="flex items-center gap-xs">
              <button type="button" onClick={reset} title="Nieuw gesprek" aria-label="Nieuw gesprek" className="rounded-full p-xs hover:bg-white/15">
                <Icon name="restart_alt" className="text-[20px]" />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Sluit chat" className="rounded-full p-xs hover:bg-white/15">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-sm overflow-y-auto px-md py-md" aria-live="polite">
            <Bubble role="assistant">{SUPPORT_GREETING}</Bubble>

            {chat.messages.length === 0 && (
              <div className="flex flex-wrap gap-xs">
                {STARTERS[chat.audience].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-primary/40 bg-white px-sm py-xs text-left text-label-md text-primary hover:bg-primary/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {chat.messages.map((m, i) => (
              <div key={i}>
                <Bubble role={m.role}>{m.content}</Bubble>
                {m.role === "assistant" && (
                  <div className="mt-xs flex flex-wrap items-center gap-xs pl-xs">
                    {m.sources?.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/help/${s.slug}`}
                        className="inline-flex items-center gap-[2px] rounded-full bg-surface-container-high px-sm py-[2px] text-label-sm text-on-surface hover:bg-primary/10"
                      >
                        <Icon name="menu_book" className="text-[14px]" /> {s.title}
                      </Link>
                    ))}
                    {m.id && (
                      <span className="ml-auto flex gap-[2px]">
                        <button
                          type="button"
                          aria-label="Nuttig"
                          disabled={m.helpful != null}
                          onClick={() => rate(i, true)}
                          className={cn("rounded-full p-[2px] text-outline hover:text-primary", m.helpful === true && "text-primary")}
                        >
                          <Icon name="thumb_up" className="text-[16px]" filled={m.helpful === true} />
                        </button>
                        <button
                          type="button"
                          aria-label="Niet nuttig"
                          disabled={m.helpful != null}
                          onClick={() => rate(i, false)}
                          className={cn("rounded-full p-[2px] text-outline hover:text-error", m.helpful === false && "text-error")}
                        >
                          <Icon name="thumb_down" className="text-[16px]" filled={m.helpful === false} />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-xs pl-xs text-label-sm text-on-surface-variant" role="status">
                <span className="inline-flex gap-[3px]">
                  <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-primary" />
                </span>
                De assistent typt…
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg bg-error-container p-sm text-label-md text-on-error-container">
                {error}
              </div>
            )}

            {offer && !ticket && (
              <ChatTicketForm
                sessionId={chat.sessionId}
                audience={chat.audience}
                category={offer.category}
                subjectSeed={lastUser}
                onCreated={(number, url) => setTicket({ number, url })}
                onDismiss={() => setOffer(null)}
              />
            )}
            {ticket && (
              <div className="rounded-xl bg-primary-fixed/50 p-md text-body-md text-on-surface">
                <Icon name="check_circle" className="mr-xs align-middle text-primary" filled /> Ticket <strong>{ticket.number}</strong> is aangemaakt.{" "}
                <Link href={ticket.url} className="text-primary underline">
                  Bekijk je ticket
                </Link>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-outline-variant/40 bg-white p-sm"
          >
            <div className="flex items-center gap-xs">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                placeholder="Typ je vraag…"
                aria-label="Je vraag"
                className="flex-1 rounded-full border border-outline-variant px-md py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Verstuur"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-50"
              >
                <Icon name="send" className="text-[20px]" />
              </button>
            </div>
            <p className="mt-xs text-center text-label-sm text-on-surface-variant">
              Je praat met een AI. Geen wachtwoorden delen. <Link href="/privacy" className="underline">Privacy</Link>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-primary px-md py-sm text-body-md text-on-primary">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div
        className="prose-blog flex max-w-[88%] flex-col gap-xs break-words rounded-2xl rounded-bl-sm border border-outline-variant/40 bg-white px-md py-sm text-body-md text-on-surface"
        // renderMarkdown HTML-escapes first and only allows http(s)/relative links.
        dangerouslySetInnerHTML={{ __html: renderMarkdown(children) }}
      />
    </div>
  );
}

function ChatTicketForm({
  sessionId,
  audience,
  category,
  subjectSeed,
  onCreated,
  onDismiss,
}: {
  sessionId: string;
  audience: "prospect" | "salon";
  category: string;
  subjectSeed: string;
  onCreated: (number: string, url: string) => void;
  onDismiss: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const seed = subjectSeed.trim().replace(/\s+/g, " ");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: audience === "salon" ? undefined : String(fd.get("name") ?? ""),
          email: audience === "salon" ? undefined : String(fd.get("email") ?? ""),
          subject: `Vraag via chat: ${seed.slice(0, 80) || "hulpvraag"}`,
          message: String(fd.get("message") ?? ""),
          category,
          website: String(fd.get("website") ?? ""),
          chatSessionId: sessionId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Ticket aanmaken mislukt.");
        return;
      }
      onCreated(data.ticketNumber, data.url);
    } catch {
      setError("Ticket aanmaken mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-outline-variant bg-white px-sm py-xs text-body-md outline-none focus:border-primary";
  return (
    <form onSubmit={submit} className="space-y-xs rounded-xl border border-primary/40 bg-primary-fixed/30 p-md">
      <div className="flex items-start justify-between gap-sm">
        <p className="text-label-md font-label-md text-on-surface">Laat een medewerker meekijken</p>
        <button type="button" onClick={onDismiss} aria-label="Sluiten" className="text-on-surface-variant">
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      <p className="text-label-sm text-on-surface-variant">Deze chat wordt als context meegestuurd, je hoeft niets opnieuw uit te leggen.</p>
      {audience !== "salon" && (
        <>
          <input name="name" required minLength={2} placeholder="Je naam" autoComplete="name" className={field} />
          <input name="email" type="email" required placeholder="Je e-mailadres" autoComplete="email" className={field} />
        </>
      )}
      <textarea name="message" required minLength={5} rows={3} maxLength={2000} defaultValue={subjectSeed} placeholder="Wat wil je nog toevoegen?" className={`${field} resize-none`} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <p role="alert" className="text-label-sm text-error">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-full bg-primary py-xs text-label-md font-label-md text-on-primary disabled:opacity-60">
        {busy ? "Aanmaken…" : "Ticket aanmaken"}
      </button>
    </form>
  );
}
