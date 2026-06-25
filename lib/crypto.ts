import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production");
    }
    // Dev-only fallback: 32 zero bytes
    return Buffer.alloc(32);
  }
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  return buf;
}

/** Encrypt a plaintext string. Returns `iv:ciphertext:authtag` (all hex). */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

/** Decrypt a string produced by `encrypt`. Returns null if malformed or wrong key. */
export function decrypt(ciphertext: string): string | null {
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) return null;
    const [ivHex, dataHex, tagHex] = parts;
    const key = getKey();
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex!, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex!, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex!, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
