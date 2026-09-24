import { amsterdamDateKey, amsterdamTimeKey, amsterdamWallTimeToUtc } from "@/lib/salon/timezone";

/**
 * `<input type="datetime-local">` gives a wall-clock string with no zone
 * ("2026-10-12T09:30"). Every klus time is an *Amsterdam* wall clock (see
 * lib/salon/timezone.ts), never the server's local zone — Vercel runs in UTC.
 */
export function parseAmsterdamLocal(value: string | null | undefined): Date | null {
  const m = (value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const hour = Number(h);
  const minute = Number(mi);
  if (hour > 23 || minute > 59) return null;
  const noon = new Date(`${y}-${mo}-${d}T12:00:00Z`);
  if (Number.isNaN(noon.getTime())) return null;
  // Reject impossible dates like 2026-02-31 (Date would roll them over).
  if (noon.toISOString().slice(0, 10) !== `${y}-${mo}-${d}`) return null;
  return amsterdamWallTimeToUtc(noon, 0, hour * 60 + minute);
}

/** Inverse of parseAmsterdamLocal — value for a datetime-local input. */
export function toAmsterdamLocalInput(date: Date | null | undefined): string {
  if (!date) return "";
  return `${amsterdamDateKey(date)}T${amsterdamTimeKey(date)}`;
}

/** "YYYY-MM-DD" (date input) → UTC midnight-ish noon instant for that day. */
export function parseDateInput(value: string | null | undefined): Date | null {
  const m = (value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}

export function toDateInput(date: Date | null | undefined): string {
  return date ? amsterdamDateKey(date) : "";
}

/** Monday 00:00 (Amsterdam) of the week containing `date`, as a UTC instant. */
export function startOfAmsterdamWeek(date: Date): Date {
  const [y, m, d] = amsterdamDateKey(date).split("-").map(Number) as [number, number, number];
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun..6 Sat
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  return amsterdamWallTimeToUtc(date, offsetToMonday, 0);
}
