import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";
import { ATTACHMENT_MAX_BYTES, isAllowedAttachmentType, safeFileName } from "@/lib/support/attachments";

export const runtime = "nodejs";

/** Public ticket-attachment upload (guests have no account) — hence strict type/size/rate limits. */
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Bijlagen uploaden is tijdelijk niet beschikbaar." }, { status: 503 });
  }
  if (!rateLimit(`upload:${clientIp(req)}`, 10, 3_600_000).ok) {
    return NextResponse.json({ error: "Te veel uploads. Probeer het later opnieuw." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
  }
  if (!isAllowedAttachmentType(file.type)) {
    return NextResponse.json({ error: "Alleen JPG, PNG, WebP of PDF toegestaan." }, { status: 400 });
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return NextResponse.json({ error: "Bestand is groter dan 5MB." }, { status: 400 });
  }

  const name = safeFileName(file.name);
  const blob = await put(`support/${Date.now()}-${name}`, file, { access: "public", addRandomSuffix: true });
  return NextResponse.json({ url: blob.url, name, size: file.size, type: file.type });
}
