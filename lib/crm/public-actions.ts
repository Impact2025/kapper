"use server";

import { redirect } from "next/navigation";
import { optOutByToken } from "@/lib/crm/outreach";

/** Button on /afmelden — a POST, so link scanners can't opt people out. */
export async function optOutAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  await optOutByToken(token);
  redirect(`/afmelden/${encodeURIComponent(token)}?klaar=1`);
}
