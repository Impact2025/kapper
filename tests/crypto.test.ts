import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

beforeAll(() => {
  // 32 zero bytes as hex (dev fallback key)
  process.env.ENCRYPTION_KEY = "0".repeat(64);
});

describe("AES-256-GCM encrypt/decrypt", () => {
  it("round-trips a plaintext string", () => {
    const plain = "sk-test-1234567890abcdef";
    const cipher = encrypt(plain);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("produces a different ciphertext every call (random IV)", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same");
    expect(decrypt(b)).toBe("same");
  });

  it("output format is iv:ciphertext:authtag (3 colon-separated hex parts)", () => {
    const cipher = encrypt("hello");
    const parts = cipher.split(":");
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part).toMatch(/^[0-9a-f]+$/);
    }
  });

  it("returns null for malformed ciphertext", () => {
    expect(decrypt("not-valid")).toBeNull();
    expect(decrypt("a:b")).toBeNull();
    expect(decrypt("")).toBeNull();
  });

  it("returns null when auth tag is tampered (integrity check)", () => {
    const cipher = encrypt("secret");
    const parts = cipher.split(":");
    // Flip the last byte of the auth tag
    const badTag = parts[2]!.slice(0, -2) + "ff";
    const tampered = `${parts[0]}:${parts[1]}:${badTag}`;
    expect(decrypt(tampered)).toBeNull();
  });

  it("handles unicode and special characters", () => {
    const plain = "Geheime sleutel: €500 🔑 ñoño";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });
});
