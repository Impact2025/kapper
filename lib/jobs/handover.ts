import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, salons } from "@/lib/db/schema";
import { jobPhotos, jobs } from "@/lib/db/schema-jobs";
import { getVerticalConfig } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { brandFor, shell } from "@/lib/mail/templates";
import { notifyCustomer } from "@/lib/jobs/notify";
import { parseBusinessProfile } from "@/lib/jobs/business";
import { handoverPath, verifyHandoverSignature } from "@/lib/jobs/handover-link";
import { logJobEvent } from "@/lib/jobs/lifecycle";

/** Only klussen that are actually done get an opleverpagina. */
const HANDOVER_STATUSES = ["completed", "invoiced", "paid"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const handoverUrl = (vertical: string, jobId: string) => `${siteUrlFor(vertical)}${handoverPath(jobId)}`;

/** Public view of a finished klus: no internal notes, no prices, no customer
 * contact data — only what the klant may see about their own tuin. */
export async function getHandoverByLink(jobId: string, sig: string) {
  if (!UUID_RE.test(jobId) || !verifyHandoverSignature(jobId, sig)) return null;
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), inArray(jobs.status, HANDOVER_STATUSES)))
    .limit(1);
  if (!job) return null;
  const [[salon], photos] = await Promise.all([
    db.select().from(salons).where(eq(salons.id, job.salonId)).limit(1),
    db
      .select({ id: jobPhotos.id, blobUrl: jobPhotos.blobUrl, kind: jobPhotos.kind, caption: jobPhotos.caption })
      .from(jobPhotos)
      .where(and(eq(jobPhotos.jobId, job.id), inArray(jobPhotos.kind, ["before", "during", "after"])))
      .orderBy(asc(jobPhotos.createdAt)),
  ]);
  if (!salon) return null;
  return {
    job: {
      number: job.number,
      title: job.title,
      addressLine: job.addressLine,
      workSummary: job.workSummary,
      completedAt: job.completedAt,
      signedByName: job.signedByName,
      warrantyUntil: job.warrantyUntil,
      checklist: job.checklist,
    },
    photos,
    business: parseBusinessProfile(salon.settings, salon.name),
    pack: getVerticalConfig(salon.vertical),
  };
}

/** Sends the klant a link to their opleverpagina (WhatsApp and/or e-mail). */
export async function sendHandoverPage(
  salonId: string,
  jobId: string,
  actorUserId?: string | null,
): Promise<{ ok: true; whatsapp: boolean; email: boolean } | { error: string }> {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, salonId)))
    .limit(1);
  if (!job) return { error: "Klus niet gevonden." };
  if (!HANDOVER_STATUSES.includes(job.status)) return { error: "De opleverpagina kan pas na afronding van de klus." };
  if (!job.customerId) return { error: "Er is geen klant aan deze klus gekoppeld." };
  const [[salon], [customer]] = await Promise.all([
    db.select().from(salons).where(eq(salons.id, salonId)).limit(1),
    db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1),
  ]);
  if (!salon || !customer) return { error: "Klant niet gevonden." };
  if (!customer.phone && !customer.email) return { error: "Deze klant heeft geen telefoonnummer of e-mailadres." };

  const url = handoverUrl(salon.vertical, job.id);
  const first = customer.name.split(" ")[0] || "";
  const text = `Hoi ${first}! ${salon.name} hier: het werk is afgerond. Bekijk het resultaat met voor- en nafoto's hier: ${url}`;
  const html = shell(
    "Je klus is afgerond",
    `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${text.replace(/</g, "&lt;")}</p><p style="margin:0;"><a href="${url}">Bekijk het resultaat →</a></p>`,
    brandFor(salon.vertical),
  );
  const res = await notifyCustomer({
    salon,
    phone: customer.phone,
    email: customer.email,
    text,
    emailSubject: `Je klus is afgerond — ${salon.name}`,
    emailHtml: html,
  });
  if (!res.whatsapp && !res.email) return { error: "Versturen is niet gelukt. Kopieer de link en stuur hem zelf." };
  await logJobEvent({ salonId, jobId, kind: "note", message: "Opleverpagina naar de klant gestuurd", actorUserId });
  return { ok: true, ...res };
}
