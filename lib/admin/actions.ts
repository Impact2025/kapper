"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { salonNotes } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { auditAdmin } from "@/lib/admin/audit";

export interface NoteActionState {
  ok?: boolean;
  error?: string;
}

const noteSchema = z.object({
  salonId: z.string().uuid(),
  body: z.string().trim().min(1, "Notitie mag niet leeg zijn.").max(5000),
});

export async function addSalonNote(_prev: NoteActionState | undefined, formData: FormData): Promise<NoteActionState> {
  const admin = await requireRole("admin");
  const parsed = noteSchema.safeParse({ salonId: formData.get("salonId"), body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };

  await db.insert(salonNotes).values({
    salonId: parsed.data.salonId,
    authorId: admin.id,
    authorName: admin.name ?? admin.email,
    body: parsed.data.body,
  });
  await auditAdmin(admin, "salon.note", { type: "salon", id: parsed.data.salonId });
  revalidatePath(`/admin/klanten/${parsed.data.salonId}`);
  return { ok: true };
}
