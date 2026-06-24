import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ka_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  role: "admin" | "owner";
  [key: string]: unknown;
}

/**
 * Resolve the HMAC signing key. Reuses AUTH_SECRET. Falls back to a dev-only
 * constant outside production so local previews don't crash. Read from
 * process.env directly (not the validated env) so this stays usable in any
 * runtime, including tests.
 */
export function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-insecure-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSigningKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
