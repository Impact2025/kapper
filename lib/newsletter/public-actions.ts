"use server";

import { redirect } from "next/navigation";
import { unsubscribeByToken } from "@/lib/newsletter/subscribers";

/** Button on /nieuwsbrief/afmelden — a POST, so link scanners can't unsubscribe people. */
export async function unsubscribeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const sendId = String(formData.get("sendId") ?? "") || null;
  await unsubscribeByToken(token, sendId && /^[0-9a-f-]{36}$/i.test(sendId) ? sendId : null);
  redirect(`/nieuwsbrief/afmelden/${encodeURIComponent(token)}?klaar=1`);
}
