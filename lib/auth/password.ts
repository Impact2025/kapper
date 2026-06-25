// Node's crypto import keeps this module server-only (can't bundle to client).
// No "server-only" pragma so the seed script (plain Node/tsx) can reuse it.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

/**
 * Hash a plaintext password with scrypt. Output format: `scrypt$<saltHex>$<hashHex>`.
 * Uses Node's built-in crypto so there's no native build dependency.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password.normalize("NFKC"), salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Verify a plaintext password against a stored `scrypt$salt$hash` string. */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scrypt(password.normalize("NFKC"), salt, expected.length)) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export interface PasswordStrengthResult {
  ok: boolean;
  error?: string;
}

/** Synchronous check — min 8 chars, 1 uppercase, 1 digit. */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (password.length < 8) return { ok: false, error: "Minimaal 8 tekens" };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Minimaal één hoofdletter" };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Minimaal één cijfer" };
  return { ok: true };
}
