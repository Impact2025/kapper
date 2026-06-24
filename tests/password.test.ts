import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("Sterk-Wachtwoord-123");
    expect(await verifyPassword("Sterk-Wachtwoord-123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Sterk-Wachtwoord-123");
    expect(await verifyPassword("verkeerd", hash)).toBe(false);
  });

  it("produces a salted format with unique hashes", async () => {
    const a = await hashPassword("zelfde");
    const b = await hashPassword("zelfde");
    expect(a).not.toBe(b); // random salt
    expect(a.startsWith("scrypt$")).toBe(true);
  });

  it("returns false for null/garbage stored values", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
