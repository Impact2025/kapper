import { describe, it, expect, beforeAll } from "vitest";
import { encryptSession, decryptSession } from "@/lib/auth/jwt";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long-xx";
});

describe("session jwt", () => {
  it("round-trips a payload", async () => {
    const token = await encryptSession({ userId: "abc-123", role: "admin" });
    const payload = await decryptSession(token);
    expect(payload?.userId).toBe("abc-123");
    expect(payload?.role).toBe("admin");
  });

  it("returns null for undefined or tampered tokens", async () => {
    expect(await decryptSession(undefined)).toBeNull();
    const token = await encryptSession({ userId: "abc", role: "owner" });
    expect(await decryptSession(token + "tampered")).toBeNull();
  });

  it("rejects a token signed with a different key", async () => {
    const token = await encryptSession({ userId: "abc", role: "owner" });
    process.env.AUTH_SECRET = "a-completely-different-secret-key-zzzz";
    expect(await decryptSession(token)).toBeNull();
    process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long-xx";
  });
});
