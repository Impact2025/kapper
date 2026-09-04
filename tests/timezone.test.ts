import { describe, it, expect } from "vitest";
import { amsterdamDateKey, amsterdamDayOfWeek, amsterdamTimeKey, amsterdamWallTimeToUtc } from "@/lib/salon/timezone";

describe("Amsterdam timezone helpers", () => {
  it("converts a summer (CEST, UTC+2) wall-clock time to the correct UTC instant", () => {
    // 2026-07-15 is deep in CEST — 10:00 Amsterdam == 08:00 UTC.
    const now = new Date(Date.UTC(2026, 6, 15, 6, 0)); // "now" is irrelevant beyond its calendar day
    const start = amsterdamWallTimeToUtc(now, 0, 10 * 60);
    expect(start.toISOString()).toBe("2026-07-15T08:00:00.000Z");
  });

  it("converts a winter (CET, UTC+1) wall-clock time to the correct UTC instant", () => {
    // 2026-01-15 is deep in CET — 10:00 Amsterdam == 09:00 UTC.
    const now = new Date(Date.UTC(2026, 0, 15, 6, 0));
    const start = amsterdamWallTimeToUtc(now, 0, 10 * 60);
    expect(start.toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });

  it("is stable no matter which timezone the calling process itself runs in", () => {
    // The whole point: this must not depend on the test runner's local TZ.
    // A UTC instant just after UTC midnight can already be the *next*
    // Amsterdam calendar day in summer (CEST, UTC+2) — 2026-07-15T22:30Z is
    // 2026-07-16 00:30 in Amsterdam.
    const lateUtc = new Date("2026-07-15T22:30:00.000Z");
    expect(amsterdamDateKey(lateUtc)).toBe("2026-07-16");
    expect(amsterdamTimeKey(lateUtc)).toBe("00:30");
  });

  it("reports the correct day of week for a known Amsterdam date", () => {
    // 2026-09-07 is a Monday.
    const monday = new Date("2026-09-07T09:00:00.000Z"); // 11:00 Amsterdam
    expect(amsterdamDayOfWeek(monday)).toBe(1);
  });

  it("round-trips a wall time through encode and decode", () => {
    const now = new Date();
    const start = amsterdamWallTimeToUtc(now, 3, 14 * 60 + 30);
    expect(amsterdamTimeKey(start)).toBe("14:30");
  });
});
