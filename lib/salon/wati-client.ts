import "server-only";
import type { WatiConfirmationPayload } from "@/lib/ai/receptionist";

/** Send a WhatsApp message via WATI. */
export async function sendWatiMessage(
  baseUrl: string,
  apiKey: string,
  phoneNumber: string,
  message: string,
): Promise<void> {
  const url = `${baseUrl}/api/v1/sendSessionMessage/${encodeURIComponent(phoneNumber)}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageText: message }),
  });
}

/** Send a WhatsApp interactive-button message via WATI (Middelburg-norm booking confirmation). */
export async function sendWatiInteractiveMessage(
  baseUrl: string,
  apiKey: string,
  phoneNumber: string,
  payload: WatiConfirmationPayload,
): Promise<void> {
  const url = `${baseUrl}/api/v1/sendInteractiveButtonsMessage/${encodeURIComponent(phoneNumber)}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: payload.text,
      buttons: [{ text: payload.buttonTitle, id: payload.buttonId }],
    }),
  });
}
