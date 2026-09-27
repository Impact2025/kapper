/**
 * Pure Europe/Amsterdam calendar-day helpers for the cockpit rollups. A salon's
 * "Tuesday" is the Dutch Tuesday, not the UTC one — a 00:30 booking belongs
 * to the day it happened for the salon, across DST switches too.
 */

const TZ = "Europe/Amsterdam";
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(v: string): boolean {
  if (!DAY_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Amsterdam offset from UTC in minutes at a given instant (+60 winter, +120 summer). */
function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** UTC instant of Amsterdam midnight starting `day` (YYYY-MM-DD). */
function amsterdamMidnight(day: string): Date {
  const utcMidnight = new Date(`${day}T00:00:00Z`);
  // Two passes: the offset at the guess can differ from the offset at the answer around DST.
  let guess = new Date(utcMidnight.getTime() - offsetMinutes(utcMidnight) * 60000);
  guess = new Date(utcMidnight.getTime() - offsetMinutes(guess) * 60000);
  return guess;
}

/** Half-open [start, end) UTC window covering one Amsterdam calendar day. */
export function amsterdamDayWindow(day: string): { start: Date; end: Date } {
  if (!isDayKey(day)) throw new Error(`Ongeldige dag: ${day}`);
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start: amsterdamMidnight(day), end: amsterdamMidnight(next.toISOString().slice(0, 10)) };
}

/** The Amsterdam calendar day (YYYY-MM-DD) an instant falls on. */
export function amsterdamDayOf(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** `count` consecutive day keys ending with the Amsterdam day before `now` (oldest first). */
export function previousDays(now: Date, count: number): string[] {
  const today = new Date(`${amsterdamDayOf(now)}T00:00:00Z`);
  const days: string[] = [];
  for (let i = count; i >= 1; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
