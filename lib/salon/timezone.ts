/**
 * Every salon this product serves is Dutch — one fixed timezone, not a
 * per-salon setting. This matters because the Node runtime's own "local"
 * timezone differs between environments (a developer's machine in Europe/
 * Amsterdam vs. Vercel's serverless functions, which run in UTC): any code
 * that built wall-clock times with `Date#setHours`/`Date#toTimeString`
 * silently meant "server-local hour", not "Amsterdam hour" — correct only
 * by accident when the two happened to match. Route every salon-facing
 * date/time through the helpers below instead.
 */
export const SALON_TIMEZONE = "Europe/Amsterdam";

const DATE_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: SALON_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const TIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: SALON_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const WEEKDAY = new Intl.DateTimeFormat("en-US", { timeZone: SALON_TIMEZONE, weekday: "short" });
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** "YYYY-MM-DD" for the given instant, as observed on an Amsterdam wall clock. */
export function amsterdamDateKey(date: Date): string {
  return DATE_PARTS.format(date);
}

/** "HH:MM" for the given instant, as observed on an Amsterdam wall clock. */
export function amsterdamTimeKey(date: Date): string {
  return TIME_PARTS.format(date);
}

/** 0 (Sun) .. 6 (Sat), matching `Date#getDay()`'s convention — in Amsterdam time. */
export function amsterdamDayOfWeek(date: Date): number {
  return WEEKDAY_INDEX[WEEKDAY.format(date)]!;
}

/**
 * The UTC instant corresponding to `minuteOfDay` minutes past midnight, on
 * the Amsterdam calendar day that is `dayOffset` days after `from`. Two-step
 * DST-correct: guess as if the offset were 0, read Amsterdam's actual offset
 * at that guess, then re-apply — accurate except inside the ~1h DST
 * transition itself, an acceptable edge case for a booking slot grid.
 */
export function amsterdamWallTimeToUtc(from: Date, dayOffset: number, minuteOfDay: number): Date {
  const [y, m, d] = amsterdamDateKey(from).split("-").map(Number) as [number, number, number];
  const guess = new Date(Date.UTC(y, m - 1, d + dayOffset, 0, minuteOfDay));
  const offsetMin = amsterdamOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMin * 60_000);
}

/** Amsterdam's UTC offset in minutes (positive east of UTC) at the given instant. */
function amsterdamOffsetMinutes(date: Date): number {
  const asUtc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const asAmsterdam = new Date(date.toLocaleString("en-US", { timeZone: SALON_TIMEZONE }));
  return (asAmsterdam.getTime() - asUtc.getTime()) / 60_000;
}
