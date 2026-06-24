import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  encryptSession,
  decryptSession,
  type SessionPayload,
} from "@/lib/auth/jwt";

export { SESSION_COOKIE, encryptSession, decryptSession };
export type { SessionPayload };

/** Issue a session cookie for the given user. Server-only (Server Action / Route). */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Read & verify the current session from the cookie store. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
}
