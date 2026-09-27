/**
 * Optional `publishedAt` of the ingest routes, so imported articles keep their
 * own date. Accepts a YYYY-MM-DD date or a full ISO timestamp; a date in the
 * future is refused (an article cannot be published tomorrow). Pure.
 */
export type PublishedAtResult = { ok: true; date: Date | null } | { ok: false; error: string };

export function parsePublishedAt(input: unknown, now: Date = new Date()): PublishedAtResult {
  if (input === undefined || input === null || input === "") return { ok: true, date: null };
  if (typeof input !== "string") return { ok: false, error: "publishedAt must be an ISO date string" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    // A bare date is taken at a fixed mid-morning UTC time so it never rolls over to the previous
    // day in any timezone. "Today" is judged by the Amsterdam calendar day, and today's date before
    // 09:00 UTC is clamped to now instead of being refused as the future.
    const date = new Date(`${input}T09:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return { ok: false, error: "publishedAt is not a valid date" };
    if (input > amsterdamDay(now)) return { ok: false, error: "publishedAt cannot be in the future" };
    return { ok: true, date: date.getTime() > now.getTime() ? now : date };
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "publishedAt is not a valid date" };
  if (date.getTime() > now.getTime()) return { ok: false, error: "publishedAt cannot be in the future" };
  return { ok: true, date };
}

/** YYYY-MM-DD of `now` in Europe/Amsterdam. */
function amsterdamDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
