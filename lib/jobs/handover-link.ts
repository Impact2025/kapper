import { createHmac, timingSafeEqual } from "node:crypto";
import { getSigningKey } from "@/lib/auth/jwt";

/**
 * Opleverpagina-link: stateless, geen extra kolom nodig. De handtekening is
 * een HMAC over het klus-id, dus alleen wie de link van de vakman kreeg kan de
 * pagina openen; een gok op een ander klus-id faalt. Pure functies — unit tested.
 */
export function handoverSignature(jobId: string): string {
  return createHmac("sha256", getSigningKey()).update(`oplevering:${jobId}`).digest("base64url").slice(0, 32);
}

export function verifyHandoverSignature(jobId: string, sig: string): boolean {
  const expected = Buffer.from(handoverSignature(jobId));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const handoverPath = (jobId: string) => `/oplevering/${jobId}/${handoverSignature(jobId)}`;
