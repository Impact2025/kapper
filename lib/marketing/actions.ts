"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { salons } from "@/lib/db/schema";
import { requireSalonOwner } from "@/lib/auth/dal";
import type { ActionState } from "@/lib/salon/actions";

const marketingSchema = z.object({
  reviewRequestsEnabled: z.boolean(),
  googleReviewLink: z.string().max(500).optional().or(z.literal("")),
  retentionEnabled: z.boolean(),
});

export async function updateMarketingSettings(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();

  const parsed = marketingSchema.safeParse({
    reviewRequestsEnabled: formData.get("reviewRequestsEnabled") === "true",
    googleReviewLink: formData.get("googleReviewLink") ?? "",
    retentionEnabled: formData.get("retentionEnabled") === "true",
  });
  if (!parsed.success) return { error: "Ongeldige invoer." };

  if (parsed.data.reviewRequestsEnabled && !parsed.data.googleReviewLink) {
    return { error: "Vul een reviewlink in om automatische review-verzoeken aan te zetten." };
  }

  await db
    .update(salons)
    .set({
      settings: sql`${salons.settings} || jsonb_build_object('marketing', ${JSON.stringify(parsed.data)}::jsonb)`,
    })
    .where(eq(salons.id, user.salonId));

  revalidatePath("/dashboard/retentie");
  return { success: true };
}
