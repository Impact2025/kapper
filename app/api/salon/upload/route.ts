import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireSalonOwner } from "@/lib/auth/dal";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Dossier photo uploads (voor/na-foto's) — salon-scoped, unlike the
 * /api/admin/upload route this deliberately does not share with (that one
 * is for blog cover images and only requires a logged-in user, not
 * specifically a salon owner). */
export async function POST(request: Request) {
  const user = await requireSalonOwner();

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Alleen JPG, PNG, WebP of GIF toegestaan." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Bestand is groter dan 5MB." }, { status: 400 });
  }

  const blob = await put(`dossier/${user.salonId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
