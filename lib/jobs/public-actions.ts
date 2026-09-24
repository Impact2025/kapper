"use server";

import { revalidatePath } from "next/cache";
import { acceptQuoteByToken, declineQuoteByToken } from "@/lib/jobs/documents";

export interface PublicQuoteState {
  success?: boolean;
  error?: string;
  message?: string;
}

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;

/**
 * Customer-facing quote response — no login, protected only by the
 * unguessable link token. Both actions are conditional updates on
 * status = "sent", so a double click or a replay is harmless.
 */
export async function acceptQuoteAction(_prev: PublicQuoteState | undefined, fd: FormData): Promise<PublicQuoteState> {
  const token = String(fd.get("token") ?? "");
  if (!TOKEN_RE.test(token)) return { error: "Ongeldige link." };
  if (fd.get("agree") !== "on") return { error: "Vink aan dat je akkoord gaat met de offerte." };
  const res = await acceptQuoteByToken(token, String(fd.get("name") ?? ""));
  if ("error" in res) return { error: res.error };
  revalidatePath(`/offerte/${token}`);
  return { success: true, message: "Bedankt! De offerte is geaccepteerd — we nemen contact met je op om in te plannen." };
}

export async function declineQuoteAction(_prev: PublicQuoteState | undefined, fd: FormData): Promise<PublicQuoteState> {
  const token = String(fd.get("token") ?? "");
  if (!TOKEN_RE.test(token)) return { error: "Ongeldige link." };
  const res = await declineQuoteByToken(token, String(fd.get("reason") ?? ""));
  if ("error" in res) return { error: res.error };
  revalidatePath(`/offerte/${token}`);
  return { success: true, message: "De offerte is afgewezen. Bedankt voor je reactie." };
}
