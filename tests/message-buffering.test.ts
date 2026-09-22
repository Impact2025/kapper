import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { collapseConsecutiveRoles, isDebounceQuiet, resolveWatiCredentials } from "@/lib/ai/wati-turn";

describe("collapseConsecutiveRoles", () => {
  it("merges a burst of consecutive user messages into one turn", () => {
    const out = collapseConsecutiveRoles([
      { role: "assistant", content: "Hoi, waarmee kan ik helpen?" },
      { role: "user", content: "hoi" },
      { role: "user", content: "ik wil een afspraak" },
      { role: "user", content: "morgen 14u graag" },
    ]);

    expect(out).toHaveLength(2);
    expect(out[1]!.role).toBe("user");
    expect(out[1]!.content).toBe("hoi\nik wil een afspraak\nmorgen 14u graag");
  });

  it("keeps alternating messages unchanged", () => {
    const history = [
      { role: "user" as const, content: "hoi" },
      { role: "assistant" as const, content: "Hoi!" },
      { role: "user" as const, content: "ik wil een afspraak" },
    ];
    expect(collapseConsecutiveRoles(history)).toEqual(history);
  });

  it("keeps the last image in a merged burst", () => {
    const out = collapseConsecutiveRoles([
      { role: "user", content: "kijk hier", imageUrl: "https://example.com/1.jpg" },
      { role: "user", content: "en dit ook", imageUrl: "https://example.com/2.jpg" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.imageUrl).toBe("https://example.com/2.jpg");
  });
});

describe("isDebounceQuiet", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("is not quiet yet when the newest message just arrived", () => {
    const latest = new Date(now.getTime() - 500); // 0.5s ago
    expect(isDebounceQuiet(latest, 6_000, 1_500, now)).toBe(false);
  });

  it("is quiet once the full debounce window has elapsed", () => {
    const latest = new Date(now.getTime() - 6_000); // exactly 6s ago
    expect(isDebounceQuiet(latest, 6_000, 1_500, now)).toBe(true);
  });

  it("tolerates QStash scheduling jitter just under the window", () => {
    const latest = new Date(now.getTime() - 5_000); // 5s ago, within the 1.5s slack
    expect(isDebounceQuiet(latest, 6_000, 1_500, now)).toBe(true);
  });

  it("still waits when well outside the jitter slack", () => {
    const latest = new Date(now.getTime() - 3_000); // 3s ago
    expect(isDebounceQuiet(latest, 6_000, 1_500, now)).toBe(false);
  });
});

describe("resolveWatiCredentials", () => {
  const decrypt = (v: string) => (v.startsWith("enc:") ? v.slice(4) : null);

  it("prefers the global env credential when set", () => {
    const salon = { settings: { ai: { watiApiKey: "enc:per-salon-key" } } } as never;
    const result = resolveWatiCredentials(salon, "env-key", "https://live.wati.io", decrypt);
    expect(result).toEqual({ watiApiKey: "env-key", watiBaseUrl: "https://live.wati.io" });
  });

  it("decrypts a per-salon key when no env fallback is set", () => {
    const salon = { settings: { ai: { watiApiKey: "enc:per-salon-key" } } } as never;
    const result = resolveWatiCredentials(salon, undefined, "https://live.wati.io", decrypt);
    expect(result?.watiApiKey).toBe("per-salon-key");
  });

  it("returns null when no WATI base URL is configured anywhere", () => {
    const salon = { settings: { ai: { watiApiKey: "enc:per-salon-key" } } } as never;
    expect(resolveWatiCredentials(salon, "env-key", undefined, decrypt)).toBeNull();
  });

  it("returns null when the salon has no WATI key and no env fallback exists", () => {
    const salon = { settings: { ai: {} } } as never;
    expect(resolveWatiCredentials(salon, undefined, "https://live.wati.io", decrypt)).toBeNull();
  });
});
