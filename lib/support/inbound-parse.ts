/** Pure helpers voor binnenkomende ticket-mail (geen I/O, unit-getest). */

/** "Jan de Vries <jan@example.nl>" → "jan@example.nl" (lowercase). */
export function extractSenderEmail(from: string): string | null {
  const m = /<([^<>\s]+@[^<>\s]+)>/.exec(from) ?? /([^\s<>"']+@[^\s<>"']+)/.exec(from);
  return m ? m[1]!.trim().toLowerCase() : null;
}

/** "Jan de Vries <jan@…>" → "Jan de Vries" (valt terug op het lokale deel van het adres). */
export function extractSenderName(from: string): string {
  const name = from.replace(/<[^>]*>/g, "").replace(/["']/g, "").trim();
  if (name) return name.slice(0, 120);
  return (extractSenderEmail(from)?.split("@")[0] ?? "Onbekend").slice(0, 120);
}

/** Auto-replies, bounces and mailing-list mail must never create ticket traffic (mail loops). */
export function isAutoReply(headers: Record<string, string> | null | undefined, from: string): boolean {
  const h = Object.fromEntries(Object.entries(headers ?? {}).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  if (h["auto-submitted"] && h["auto-submitted"] !== "no") return true;
  if (/(bulk|junk|list|auto_reply)/.test(h["precedence"] ?? "")) return true;
  if (h["x-auto-response-suppress"] || h["list-id"] || h["x-autoreply"] || h["x-autorespond"]) return true;
  return /(mailer-daemon|postmaster|no-?reply|do-?not-?reply)@/i.test(from);
}

const QUOTE_MARKERS: RegExp[] = [
  /^-{2,}\s*(original message|oorspronkelijk bericht|origineel bericht|forwarded message)/i,
  /^_{5,}$/,
  /^on .{5,200}wrote:\s*$/i,
  /^op .{5,200}schreef.*:\s*$/i,
  /^(van|from):\s.+/i,
  /^>+\s?/,
  /^(verzonden vanaf|sent from) (mijn|my) /i,
];

/**
 * Cut the quoted history from a reply so the ticket thread only gets the new text.
 * Conservative: if stripping would leave nothing, the original is kept.
 */
export function stripQuotedReply(text: string, maxLen = 5000): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    // "Op ma 1 jan om 10:00 schreef X <x@y>:" is often wrapped over two lines.
    const joined = `${trimmed} ${(lines[i + 1] ?? "").trim()}`.trim();
    if (QUOTE_MARKERS.some((re) => re.test(trimmed)) || (/^(on|op) /i.test(trimmed) && /(wrote|schreef)[^\n]*:\s*$/i.test(joined))) break;
    kept.push(line);
  }
  const result = kept.join("\n").trim();
  return (result || text.trim()).slice(0, maxLen);
}

/** `support+KA-10001@…` plus-addressing or `[KA-10001]` in the subject. */
export function ticketNumberFromMail(subject: string, to: string[]): number | null {
  for (const addr of to) {
    const m = /\+ka-?(\d{3,9})@/i.exec(addr);
    if (m) return Number(m[1]);
  }
  const s = /(?:\[|\b)KA[-\s#]?(\d{3,9})\b/i.exec(subject);
  return s ? Number(s[1]) : null;
}
