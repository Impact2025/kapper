import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, users } from "@/lib/db/schema";
import { customerAddresses } from "@/lib/db/schema-jobs";
import { getVerticalConfig } from "@/lib/verticals";
import { brandFor, shell } from "@/lib/mail/templates";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { sendEmail } from "@/lib/mail/resend";
import { notifyCustomer } from "@/lib/jobs/notify";
import { upsertJobCustomer, createAddress } from "@/lib/jobs/crm";
import { addJobPhoto, categoryFor, createJob } from "@/lib/jobs/lifecycle";
import { formatAddressLine, normalizePostalCode, type JobPriority, type JobSource } from "@/lib/jobs/model";
import { captureError } from "@/lib/observability";
import { trackEvent } from "@/lib/analytics/track";

export interface JobRequestInput {
  salonId: string;
  customer: { name: string; phone: string; email?: string | null };
  address?: { street: string; houseNumber: string; postalCode: string; city: string } | null;
  description: string;
  category?: string | null;
  /** "spoed" forces urgent; anything else falls back to keyword detection. */
  urgency?: "spoed" | "normaal" | null;
  preferredTime?: string | null;
  conversationId?: string | null;
  source: JobSource;
  photoUrl?: string | null;
  appointment?: { id: string; start: Date; minutes?: number | null; staffId?: string | null } | null;
}

export interface JobRequestResult {
  jobId: string;
  number: string;
  priority: JobPriority;
  urgent: boolean;
  addressLine: string | null;
  customerId: string;
  /** Set when the postcode couldn't be validated — the address is kept as
   * free text on the klus instead of a saved address row. */
  addressWarning?: string;
}

/**
 * The single entry for "someone needs a klus done": the AI receptionist
 * (WhatsApp + phone) and the manual "nieuwe klus" form both land here. Finds
 * or creates the customer and the klusadres, creates the klus with the
 * category's checklist, attaches the customer's photo, and — for spoed —
 * alerts the owner immediately.
 */
export async function registerJobRequest(input: JobRequestInput): Promise<JobRequestResult | { error: string }> {
  const [salon] = await db.select().from(salons).where(eq(salons.id, input.salonId)).limit(1);
  if (!salon) return { error: "Bedrijf niet gevonden." };
  const pack = getVerticalConfig(salon.vertical);
  if (pack.archetype !== "job") return { error: "Dit bedrijf gebruikt geen klus-CRM." };

  const name = input.customer.name.trim();
  if (!name || !input.customer.phone.trim()) return { error: "Naam en telefoonnummer zijn verplicht." };
  if (!input.description.trim()) return { error: "Beschrijf kort wat er aan de hand is." };

  const { customer } = await upsertJobCustomer({
    salonId: input.salonId,
    name,
    phone: input.customer.phone,
    email: input.customer.email ?? null,
    source: input.source === "ai_phone" ? "ai_phone" : input.source === "ai_whatsapp" ? "ai_whatsapp" : "manual",
  });

  // Klusadres: reuse an existing row for the same postcode + huisnummer.
  let addressId: string | null = null;
  let addressLine: string | null = null;
  let addressWarning: string | undefined;
  if (input.address) {
    const a = input.address;
    const postal = normalizePostalCode(a.postalCode);
    if (!postal) {
      addressLine = `${a.street} ${a.houseNumber}, ${a.postalCode} ${a.city}`.trim();
      addressWarning = "Postcode kon niet worden gecontroleerd; adres is als tekst bewaard.";
    } else {
      const existing = await db
        .select()
        .from(customerAddresses)
        .where(and(eq(customerAddresses.customerId, customer.id), eq(customerAddresses.postalCode, postal)));
      const same = existing.find((e) => e.houseNumber.replace(/\s+/g, "").toLowerCase() === a.houseNumber.replace(/\s+/g, "").toLowerCase());
      if (same) {
        addressId = same.id;
        addressLine = formatAddressLine(same);
      } else {
        const created = await createAddress({
          salonId: input.salonId,
          customerId: customer.id,
          street: a.street,
          houseNumber: a.houseNumber,
          postalCode: postal,
          city: a.city,
        });
        if (!("error" in created)) {
          addressId = created.address.id;
          addressLine = formatAddressLine(created.address);
        }
      }
    }
  }

  const category = categoryFor(pack, input.category);
  const desc = input.description.trim();
  const title = `${category?.label ?? "Klus"}: ${desc.length > 70 ? `${desc.slice(0, 67)}…` : desc}`;
  const description = input.preferredTime ? `${desc}\n\nVoorkeur klant: ${input.preferredTime.trim()}` : desc;

  const job = await createJob({
    salonId: input.salonId,
    pack,
    customerId: customer.id,
    addressId,
    addressLine,
    title,
    description,
    category: category?.key,
    priority: input.urgency === "spoed" ? "urgent" : undefined,
    source: input.source,
    conversationId: input.conversationId ?? null,
    appointmentId: input.appointment?.id ?? null,
    scheduledStart: input.appointment?.start ?? null,
    estimatedMinutes: input.appointment?.minutes ?? null,
    assignedStaffId: input.appointment?.staffId ?? null,
  });

  if (input.photoUrl) {
    await addJobPhoto({ salonId: input.salonId, jobId: job.id, blobUrl: input.photoUrl, kind: "issue", caption: "Foto van de klant" });
  }

  const urgent = job.priority === "urgent";
  await trackEvent({
    type: urgent ? "job_urgent_registered" : "job_registered",
    salonId: input.salonId,
    props: { jobId: job.id, source: input.source, category: job.category },
    dedupeKey: `job:${job.id}`,
  });
  if (urgent) await alertOwnerOfUrgentJob(salon, job.number, customer.name, customer.phone, addressLine ?? job.addressLine, desc);

  return {
    jobId: job.id,
    number: job.number,
    priority: job.priority as JobPriority,
    urgent,
    addressLine: addressLine ?? job.addressLine,
    customerId: customer.id,
    ...(addressWarning ? { addressWarning } : {}),
  };
}

/** Spoedklus → owner gets an e-mail and a WhatsApp on the bedrijfsnummer
 * right away. Best effort; never blocks the customer's conversation. */
async function alertOwnerOfUrgentJob(
  salon: typeof salons.$inferSelect,
  number: string,
  customerName: string,
  customerPhone: string,
  addressLine: string | null,
  description: string,
) {
  try {
    const link = `${siteUrlFor(salon.vertical)}/dashboard/klussen`;
    const text = `🚨 SPOED ${number}: ${description.slice(0, 160)}\n${customerName} · ${customerPhone}${addressLine ? `\n📍 ${addressLine}` : ""}\n${link}`;
    const owners = await db.select({ email: users.email }).from(users).where(and(eq(users.salonId, salon.id), eq(users.role, "owner")));
    const html = shell(
      `Spoedklus ${number}`,
      `<p style="font-size:16px;line-height:1.6;margin:0 0 12px;"><strong>${description.replace(/</g, "&lt;")}</strong></p>
       <p style="font-size:16px;line-height:1.6;margin:0 0 12px;">${customerName} · ${customerPhone}${addressLine ? `<br>📍 ${addressLine}` : ""}</p>
       <p style="font-size:14px;margin:0;"><a href="${link}">Open in je klussenlijst →</a></p>`,
      brandFor(salon.vertical),
    );
    if (owners.length) {
      await sendEmail({ to: owners.map((o) => o.email), subject: `🚨 Spoedklus ${number} — ${customerName}`, html });
    }
    if (salon.phone) {
      await notifyCustomer({ salon, phone: salon.phone, email: null, text, emailSubject: "", emailHtml: "" });
    }
  } catch (err) {
    captureError("jobs/urgent-alert", err);
  }
}
