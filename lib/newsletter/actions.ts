"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { blogPosts, newsletterCampaigns, newsletterSends } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { auditAdmin } from "@/lib/admin/audit";
import { isVerticalId } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { blocksSchema, newBlockId, parseBlocks, starterBlocks, type NewsletterBlock } from "@/lib/newsletter/blocks";
import { parseSegment, segmentSchema } from "@/lib/newsletter/segment";
import { getCampaign, processNewsletterQueue, queueCampaign, sendTestEmail } from "@/lib/newsletter/campaigns";
import { addSubscriberManually, audienceFor, importCustomers } from "@/lib/newsletter/subscribers";
import { blogIntro, rewriteText, suggestSubjects, type SubjectSuggestion } from "@/lib/newsletter/ai";

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

const EDITABLE = ["draft", "scheduled"];

export async function createCampaignAction(): Promise<never> {
  const admin = await requireRole("admin");
  const [row] = await db
    .insert(newsletterCampaigns)
    .values({ name: "Nieuwe nieuwsbrief", blocks: starterBlocks(), createdBy: admin.id })
    .returning({ id: newsletterCampaigns.id });
  redirect(`/admin/nieuwsbrief/${row!.id}`);
}

export async function duplicateCampaignAction(id: string): Promise<never> {
  const admin = await requireRole("admin");
  const c = await getCampaign(id);
  if (!c) redirect("/admin/nieuwsbrief");
  const [row] = await db
    .insert(newsletterCampaigns)
    .values({
      name: `${c.name} (kopie)`,
      subject: c.subject,
      subjectB: c.subjectB,
      previewText: c.previewText,
      vertical: c.vertical,
      blocks: c.blocks,
      segment: c.segment,
      createdBy: admin.id,
    })
    .returning({ id: newsletterCampaigns.id });
  redirect(`/admin/nieuwsbrief/${row!.id}`);
}

export async function deleteCampaignAction(id: string): Promise<never> {
  const admin = await requireRole("admin");
  const c = await getCampaign(id);
  if (c && c.status === "draft") {
    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    await auditAdmin(admin, "newsletter.delete", { type: "campaign", id }, { name: c.name });
  }
  revalidatePath("/admin/nieuwsbrief");
  redirect("/admin/nieuwsbrief");
}

const saveSchema = z.object({
  name: z.string().trim().min(1, "Geef de campagne een naam.").max(200),
  subject: z.string().trim().max(200),
  subjectB: z.string().trim().max(200).optional().nullable(),
  previewText: z.string().trim().max(200).optional().nullable(),
  vertical: z.string().refine(isVerticalId, "Onbekend vak."),
  blocks: blocksSchema,
  segment: segmentSchema,
});

export type CampaignDraft = z.input<typeof saveSchema>;

export async function saveCampaignAction(id: string, draft: CampaignDraft): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = saveSchema.safeParse(draft);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  const c = await getCampaign(id);
  if (!c) return { error: "Campagne niet gevonden." };
  if (!EDITABLE.includes(c.status)) return { error: "Een verzonden campagne kan niet meer worden aangepast — dupliceer hem." };
  const d = parsed.data;
  await db
    .update(newsletterCampaigns)
    .set({
      name: d.name,
      subject: d.subject,
      subjectB: d.subjectB || null,
      previewText: d.previewText || null,
      vertical: d.vertical,
      blocks: d.blocks,
      segment: d.segment,
    })
    .where(eq(newsletterCampaigns.id, id));
  revalidatePath(`/admin/nieuwsbrief/${id}`);
  return { ok: true };
}

export async function audienceCountAction(segment: unknown): Promise<number> {
  await requireRole("admin");
  return (await audienceFor(parseSegment(segment))).length;
}

export async function sendTestAction(id: string): Promise<ActionResult> {
  const admin = await requireRole("admin");
  const c = await getCampaign(id);
  if (!c) return { error: "Campagne niet gevonden." };
  if (!parseBlocks(c.blocks).length) return { error: "De nieuwsbrief is nog leeg." };
  try {
    const sent = await sendTestEmail(c, { email: admin.email, name: admin.name });
    return sent ? { ok: true, message: `Testmail verstuurd naar ${admin.email}.` } : { error: "RESEND_API_KEY ontbreekt — testmail niet verstuurd." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Testmail mislukt." };
  }
}

export async function sendCampaignAction(id: string, scheduledAtIso: string | null): Promise<ActionResult> {
  const admin = await requireRole("admin");
  const c = await getCampaign(id);
  if (!c) return { error: "Campagne niet gevonden." };
  if (c.status !== "draft") return { error: "Deze campagne is al ingepland of verzonden." };
  if (!c.subject.trim()) return { error: "Vul eerst een onderwerpregel in." };
  if (!parseBlocks(c.blocks).length) return { error: "De nieuwsbrief is nog leeg." };

  const scheduledAt = scheduledAtIso ? new Date(scheduledAtIso) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) return { error: "Ongeldig verzendmoment." };

  const { queued } = await queueCampaign(id, scheduledAt);
  if (!queued) return { error: "Er zijn geen abonnees in deze doelgroep." };
  await auditAdmin(admin, scheduledAt ? "newsletter.schedule" : "newsletter.send", { type: "campaign", id }, { recipients: queued, subject: c.subject });
  // Start delivering right away; the 5-minute cron picks up anything left.
  if (!scheduledAt || scheduledAt.getTime() <= Date.now()) {
    after(() => processNewsletterQueue(5).catch((err) => console.error("[newsletter] send:", err)));
  }
  revalidatePath(`/admin/nieuwsbrief/${id}`);
  revalidatePath("/admin/nieuwsbrief");
  return { ok: true, message: scheduledAt ? `Ingepland voor ${queued} abonnees.` : `Wordt verzonden naar ${queued} abonnees.` };
}

export async function cancelScheduleAction(id: string): Promise<ActionResult> {
  const admin = await requireRole("admin");
  const c = await getCampaign(id);
  if (!c || c.status !== "scheduled") return { error: "Alleen een ingeplande campagne kan worden teruggezet." };
  await db.delete(newsletterSends).where(and(eq(newsletterSends.campaignId, id), inArray(newsletterSends.status, ["queued"])));
  await db.update(newsletterCampaigns).set({ status: "draft", scheduledAt: null }).where(eq(newsletterCampaigns.id, id));
  await auditAdmin(admin, "newsletter.unschedule", { type: "campaign", id });
  revalidatePath(`/admin/nieuwsbrief/${id}`);
  return { ok: true, message: "Terug naar concept." };
}

/* ---------------- AI ---------------- */

export async function aiSubjectsAction(blocks: unknown, vertical: string): Promise<{ suggestions?: SubjectSuggestion[]; error?: string }> {
  await requireRole("admin");
  const suggestions = await suggestSubjects(parseBlocks(blocks), vertical);
  return suggestions.length ? { suggestions } : { error: "Geen suggesties ontvangen — is de AI geconfigureerd?" };
}

export async function aiRewriteAction(markdown: string, instruction: string): Promise<{ markdown?: string; error?: string }> {
  await requireRole("admin");
  if (!markdown.trim() || !instruction.trim()) return { error: "Geef tekst en een instructie." };
  const out = await rewriteText(markdown.slice(0, 8000), instruction.slice(0, 300));
  return out ? { markdown: out.trim() } : { error: "Herschrijven lukte niet." };
}

/** Blog → newsletter: heading + AI intro + article card, appended to the campaign. */
export async function aiFromBlogAction(slug: string, vertical: string): Promise<{ blocks?: NewsletterBlock[]; error?: string }> {
  await requireRole("admin");
  const [post] = await db
    .select({ title: blogPosts.title, slug: blogPosts.slug, excerpt: blogPosts.excerpt, body: blogPosts.bodyMdx, coverImage: blogPosts.coverImage, vertical: blogPosts.vertical })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  if (!post) return { error: "Artikel niet gevonden of niet gepubliceerd." };
  const intro = await blogIntro({ title: post.title, excerpt: post.excerpt, body: post.body.replace(/<[^>]+>/g, " ") }, vertical);
  const url = `${siteUrlFor(post.vertical)}/blog/${post.slug}`;
  return {
    blocks: [
      ...(intro ? [{ id: newBlockId(), type: "text" as const, markdown: intro.trim() }] : []),
      { id: newBlockId(), type: "post", title: post.title, excerpt: post.excerpt ?? "", url, image: post.coverImage ?? "" },
    ],
  };
}

/* ---------------- Abonnees ---------------- */

const addSchema = z.object({
  email: z.string().trim().email("Ongeldig e-mailadres."),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  vertical: z.string().optional().or(z.literal("")),
  tags: z.string().max(300).optional().or(z.literal("")),
  consentSource: z.string().trim().min(5, "Leg vast waar/hoe deze persoon toestemming gaf.").max(300),
});

export async function addSubscriberAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin");
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  const d = parsed.data;
  const outcome = await addSubscriberManually({
    email: d.email,
    name: d.name || null,
    vertical: d.vertical && isVerticalId(d.vertical) ? d.vertical : null,
    tags: (d.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    consentSource: `handmatig (${admin.email}): ${d.consentSource}`,
  });
  if (outcome === "blocked") return { error: "Dit adres heeft zich afgemeld of is gebounced en wordt niet opnieuw toegevoegd." };
  if (outcome === "exists") return { error: "Dit adres staat al op de lijst." };
  await auditAdmin(admin, "newsletter.subscriber.add", { type: "subscriber", id: d.email.toLowerCase() });
  revalidatePath("/admin/nieuwsbrief/abonnees");
  return { ok: true, message: "Toegevoegd." };
}

export async function importCustomersAction(): Promise<ActionResult> {
  const admin = await requireRole("admin");
  const { added, skipped } = await importCustomers();
  await auditAdmin(admin, "newsletter.import", null, { added, skipped });
  revalidatePath("/admin/nieuwsbrief/abonnees");
  return { ok: true, message: `${added} klanten toegevoegd, ${skipped} stonden er al op (of hebben zich afgemeld).` };
}

export async function blogOptionsAction(vertical: string): Promise<{ slug: string; title: string }[]> {
  await requireRole("admin");
  if (!isVerticalId(vertical)) return [];
  return db
    .select({ slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), eq(blogPosts.vertical, vertical)))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(50);
}
