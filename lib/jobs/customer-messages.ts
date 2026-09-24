import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, salons } from "@/lib/db/schema";
import { getVerticalConfig } from "@/lib/verticals";
import { notifyCustomer } from "@/lib/jobs/notify";

/** "De monteur is onderweg" — WhatsApp only (no e-mail for a live ETA). */
export async function notifyEnRoute(salonId: string, customerId: string | null): Promise<boolean> {
  if (!customerId) return false;
  const [[salon], [customer]] = await Promise.all([
    db.select().from(salons).where(eq(salons.id, salonId)).limit(1),
    db.select().from(customers).where(eq(customers.id, customerId)).limit(1),
  ]);
  if (!salon || !customer?.phone) return false;
  const pack = getVerticalConfig(salon.vertical);
  const first = customer.name.split(" ")[0] || "";
  const res = await notifyCustomer({
    salon,
    phone: customer.phone,
    email: null,
    text: `Hoi ${first}! ${salon.name}: onze ${pack.terms.practitioner} is onderweg naar je toe. Tot zo!`,
    emailSubject: "",
    emailHtml: "",
  });
  return res.whatsapp;
}
