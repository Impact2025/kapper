import { describe, it, expect } from "vitest";
import { costMicroEur, parsePricing, rateFor, usdToMicroEur, microToEur } from "@/lib/ai/pricing";
import { toGatewayUsage, runWithAiContext, currentAiContext } from "@/lib/ai/usage-context";
import { amsterdamDayWindow, amsterdamDayOf, isDayKey, previousDays } from "@/lib/admin/day-window";
import { monthlyMargin } from "@/lib/admin/margin";

describe("AI pricing", () => {
  const table = parsePricing(
    JSON.stringify({
      "deepseek-v4-flash": { input: 0.25, output: 1.1, cacheRead: 0.03 },
      "claude-sonnet": { input: 3, output: 15 },
      "*": { input: 1, output: 4 },
      broken: { input: "x", output: 1 },
    }),
  );

  it("drops invalid entries and survives garbage", () => {
    expect(table.broken).toBeUndefined();
    expect(parsePricing("not json")).toEqual({});
    expect(parsePricing(undefined)).toEqual({});
    expect(parsePricing("[1,2]")).toEqual({});
  });

  it("matches exact, then longest prefix, then wildcard", () => {
    expect(rateFor("deepseek-v4-flash", table)?.input).toBe(0.25);
    expect(rateFor("claude-sonnet-5-20260101", table)?.input).toBe(3);
    expect(rateFor("unknown-model", table)?.input).toBe(1);
    expect(rateFor("x", {})).toBeNull();
  });

  it("prices tokens in micro-euro", () => {
    // 1M input @ €0.25 + 100k output @ €1.10 + 1M cache read @ €0.03
    expect(costMicroEur("deepseek-v4-flash", { inputTokens: 1_000_000, outputTokens: 100_000, cacheReadTokens: 1_000_000 }, table)).toBe(
      250_000 + 110_000 + 30_000,
    );
    // Cache writes without an explicit rate fall back to the input rate.
    expect(costMicroEur("claude-sonnet", { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 1000 }, table)).toBe(3000);
    expect(costMicroEur("m", { inputTokens: 10, outputTokens: 10 }, {})).toBeNull();
  });

  it("converts voice USD to micro-euro", () => {
    expect(usdToMicroEur(0.5, 0.9)).toBe(450_000);
    expect(usdToMicroEur(null, 0.9)).toBeNull();
    expect(usdToMicroEur(-1, 0.9)).toBeNull();
    expect(microToEur(2_500_000)).toBe(2.5);
  });
});

describe("AI usage context", () => {
  it("maps Anthropic usage and defaults missing fields to 0", () => {
    expect(toGatewayUsage("m", { input_tokens: 12, output_tokens: 3, cache_read_input_tokens: 5 }, 41.6)).toEqual({
      model: "m",
      inputTokens: 12,
      outputTokens: 3,
      cacheReadTokens: 5,
      cacheWriteTokens: 0,
      latencyMs: 42,
    });
    expect(toGatewayUsage("m", null, -5).latencyMs).toBe(0);
  });

  it("inherits the outer salon across async boundaries", async () => {
    expect(currentAiContext()).toBeUndefined();
    await runWithAiContext({ salonId: "s1", feature: "receptionist" }, async () => {
      await Promise.resolve();
      await runWithAiContext({ feature: "blog" }, async () => {
        expect(currentAiContext()).toEqual({ salonId: "s1", feature: "blog" });
      });
      expect(currentAiContext()?.feature).toBe("receptionist");
    });
  });
});

describe("Amsterdam day window", () => {
  it("covers a winter day as 23:00Z–23:00Z", () => {
    const { start, end } = amsterdamDayWindow("2026-01-15");
    expect(start.toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });

  it("covers a summer day as 22:00Z–22:00Z", () => {
    const { start, end } = amsterdamDayWindow("2026-07-01");
    expect(start.toISOString()).toBe("2026-06-30T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T22:00:00.000Z");
  });

  it("is 23 hours on the spring-forward day and 25 on fall-back", () => {
    const spring = amsterdamDayWindow("2026-03-29");
    expect((spring.end.getTime() - spring.start.getTime()) / 3_600_000).toBe(23);
    const fall = amsterdamDayWindow("2026-10-25");
    expect((fall.end.getTime() - fall.start.getTime()) / 3_600_000).toBe(25);
  });

  it("assigns late-UTC instants to the next Dutch day", () => {
    expect(amsterdamDayOf(new Date("2026-07-01T22:30:00Z"))).toBe("2026-07-02");
    expect(amsterdamDayOf(new Date("2026-07-01T21:30:00Z"))).toBe("2026-07-01");
  });

  it("validates day keys and lists previous days oldest-first", () => {
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-2-3")).toBe(false);
    expect(() => amsterdamDayWindow("gisteren")).toThrow();
    expect(previousDays(new Date("2026-09-26T10:00:00Z"), 3)).toEqual(["2026-09-23", "2026-09-24", "2026-09-25"]);
    // 23:30Z on the 25th is already the 26th in Amsterdam → yesterday is the 25th.
    expect(previousDays(new Date("2026-09-25T23:30:00Z"), 1)).toEqual(["2026-09-25"]);
  });
});

describe("monthly margin", () => {
  it("normalises cost to 30 days and grades the share", () => {
    const m = monthlyMargin({ mrrCents: 14_900, costMicroEur: 10_000_000, days: 15 }); // €10 in 15d → €20/mo
    expect(m.costEurMonth).toBe(20);
    expect(m.marginEurMonth).toBe(129);
    expect(m.marginPct).toBe(86.6);
    expect(m.tone).toBe("healthy");
    expect(monthlyMargin({ mrrCents: 10_000, costMicroEur: 40_000_000, days: 30 }).tone).toBe("watch");
    expect(monthlyMargin({ mrrCents: 10_000, costMicroEur: 150_000_000, days: 30 }).tone).toBe("loss");
  });

  it("flags cost without revenue as loss and nothing as unknown", () => {
    expect(monthlyMargin({ mrrCents: 0, costMicroEur: 1, days: 30 })).toMatchObject({ tone: "loss", marginPct: null });
    expect(monthlyMargin({ mrrCents: 0, costMicroEur: 0, days: 30 }).tone).toBe("unknown");
  });
});
