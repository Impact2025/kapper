import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "@/lib/auth/password";

describe("validatePasswordStrength", () => {
  it("accepts a strong password", () => {
    expect(validatePasswordStrength("Sterk1wachtwoord").ok).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = validatePasswordStrength("Aa1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/8/);
  });

  it("rejects passwords without an uppercase letter", () => {
    const result = validatePasswordStrength("sterk1wachtwoord");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/hoofdletter/i);
  });

  it("rejects passwords without a digit", () => {
    const result = validatePasswordStrength("SterkWachtwoord");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/cijfer/i);
  });

  it("accepts passwords with special chars as long as rules are met", () => {
    expect(validatePasswordStrength("P@ssw0rd!").ok).toBe(true);
    expect(validatePasswordStrength("Welkom2026!").ok).toBe(true);
  });

  it("boundary: exactly 8 chars with all requirements", () => {
    expect(validatePasswordStrength("Abcde1fg").ok).toBe(true);
  });

  it("boundary: 7 chars even with all requirements", () => {
    expect(validatePasswordStrength("Abcde1f").ok).toBe(false);
  });
});
