import { describe, it, expect } from "vitest";
import { parsePublishedAt } from "@/lib/blog/published-at";

const NOW = new Date("2026-09-25T12:00:00Z");

describe("parsePublishedAt", () => {
  it("treats absent input as 'use now'", () => {
    expect(parsePublishedAt(undefined, NOW)).toEqual({ ok: true, date: null });
    expect(parsePublishedAt("", NOW)).toEqual({ ok: true, date: null });
  });

  it("accepts a bare date and an ISO timestamp", () => {
    const d = parsePublishedAt("2026-02-04", NOW);
    expect(d.ok && d.date?.toISOString()).toBe("2026-02-04T09:00:00.000Z");
    const t = parsePublishedAt("2026-03-01T10:30:00Z", NOW);
    expect(t.ok && t.date?.toISOString()).toBe("2026-03-01T10:30:00.000Z");
  });

  it("refuses the future, garbage and non-strings", () => {
    expect(parsePublishedAt("2026-09-26", NOW).ok).toBe(false);
    expect(parsePublishedAt("not a date", NOW).ok).toBe(false);
    expect(parsePublishedAt(20260204, NOW).ok).toBe(false);
  });

  it("accepts today", () => {
    expect(parsePublishedAt("2026-09-25", NOW).ok).toBe(true);
  });

  it("accepts today early in the morning, clamped to now", () => {
    const early = new Date("2026-09-25T06:30:00Z"); // 08:30 Amsterdam
    const r = parsePublishedAt("2026-09-25", early);
    expect(r.ok && r.date?.toISOString()).toBe(early.toISOString());
  });

  it("judges 'today' by the Amsterdam day", () => {
    const lateUtc = new Date("2026-09-25T22:30:00Z"); // already 26 Sep 00:30 in Amsterdam
    expect(parsePublishedAt("2026-09-26", lateUtc).ok).toBe(true);
    expect(parsePublishedAt("2026-09-27", lateUtc).ok).toBe(false);
  });
});
