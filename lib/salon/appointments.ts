import "server-only";
import { and, desc, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, locations, staff, treatments } from "@/lib/db/schema";
import { decodeSlot } from "@/lib/salon/availability";
import { amsterdamDateKey, amsterdamTimeKey, amsterdamWallTimeToUtc } from "@/lib/salon/timezone";
import { getAgendaAdapter, resolveAgendaApiKey } from "@/lib/agenda";
import { captureError } from "@/lib/observability";
import { upsertCustomerByPhone, findCustomerByPhone } from "@/lib/customers/queries";
import { computeDepositRequirement, createDepositCheckoutSession } from "@/lib/payments-policy/queries";

/** `__implicit__<salonId>` slot ids (no locations/treatments/staff configured
 * yet) don't exist as real rows — never write them as a foreign key. */
function realId(id: string): string | null {
  return id.startsWith("__implicit__") ? null : id;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export interface AppointmentSummary {
  id: string;
  customerName: string;
  customerPhone: string;
  treatmentName: string;
  locationName: string;
  staffName: string;
  date: string;
  time: string;
  startISO: string;
}

export async function findAppointmentsByPhone(
  salonId: string,
  phone: string,
): Promise<AppointmentSummary[] | { error: string }> {
  const norm = normalizePhone(phone);
  if (norm.length < 6) return { error: "Vraag de klant om een (deels) volledig telefoonnummer." };

  const rows = await db
    .select({
      id: appointments.id,
      customerName: appointments.customerName,
      customerPhone: appointments.customerPhone,
      serviceType: appointments.serviceType,
      appointmentTime: appointments.appointmentTime,
      locationName: locations.name,
      staffName: staff.name,
    })
    .from(appointments)
    .leftJoin(locations, eq(locations.id, appointments.locationId))
    .leftJoin(staff, eq(staff.id, appointments.staffId))
    .where(and(eq(appointments.salonId, salonId), ne(appointments.status, "cancelled")))
    .orderBy(appointments.appointmentTime);

  const matches = rows.filter((r) => normalizePhone(r.customerPhone).endsWith(norm.slice(-8)));

  return matches.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    treatmentName: r.serviceType,
    locationName: r.locationName ?? "Salon",
    staffName: r.staffName ?? "",
    date: amsterdamDateKey(r.appointmentTime),
    time: amsterdamTimeKey(r.appointmentTime),
    startISO: r.appointmentTime.toISOString(),
  }));
}

interface BookInput {
  salonId: string;
  salonName: string;
  slotId: string;
  customerName: string;
  customerPhone: string;
  conversationId?: string | null;
  agendaProvider: string | null;
  /** Uren vóór de afspraak waarbinnen kosteloos annuleren nog mag — bepaalt cancellationDeadline. Standaard 24. */
  freeCancelHours?: number;
  /** Fase 2 vooruitbetalingen. Deposit collection needs an out-of-band
   * Stripe Checkout redirect, which only makes sense on WhatsApp — a phone
   * caller can't pause mid-call to pay, so deposits are never required for
   * channel: "phone" regardless of these settings. */
  depositRequired?: boolean;
  depositCents?: number;
  /** Middelburg-norm double-confirmation (pending_confirmation + a WhatsApp
   * button tap) only makes sense on a channel with a tappable button. A
   * phone caller can't tap anything mid-call — the AI already verbally
   * confirms name and phone before calling this (system prompt rule 5), so
   * a "phone" booking is confirmed immediately instead of left stuck in
   * pending_confirmation forever. Defaults to "whatsapp" for every other
   * caller (unchanged behavior). */
  channel?: "whatsapp" | "phone";
}

export async function bookFromSlot(input: BookInput) {
  const decoded = decodeSlot(input.slotId);
  if (!decoded) return { error: "Ongeldig slot_id — gebruik exact een slot_id uit check_availability." };
  if (!input.customerName || !input.customerPhone) {
    return { error: "customer_name en customer_phone zijn verplicht." };
  }

  const [locationRow, treatmentRow] = await Promise.all([
    realId(decoded.locationId)
      ? db.select().from(locations).where(eq(locations.id, decoded.locationId)).limit(1)
      : Promise.resolve([]),
    realId(decoded.treatmentId)
      ? db.select().from(treatments).where(eq(treatments.id, decoded.treatmentId)).limit(1)
      : Promise.resolve([]),
  ]);

  const durationMinutes = treatmentRow[0]?.durationMinutes ?? 30;
  const serviceType = treatmentRow[0]?.name ?? "Afspraak";
  const locationName = locationRow[0]?.name ?? "Salon";
  const appointmentTime = new Date(decoded.startISO);
  const freeCancelHours = input.freeCancelHours ?? 24;
  const cancellationDeadline = new Date(appointmentTime.getTime() - freeCancelHours * 60 * 60 * 1000);

  const isPhone = input.channel === "phone";

  // Three-strikes no-show policy (Fase 2): a customer blocked after repeat
  // no-shows can't self-book through the AI — checked before an existing
  // customer's phone even reaches upsertCustomerByPhone (which would create
  // a new customer for a not-yet-seen phone anyway).
  const existingCustomer = await findCustomerByPhone(input.salonId, input.customerPhone);
  if (existingCustomer?.blockedFromOnlineBooking) {
    return {
      error:
        "Voor dit telefoonnummer staan herhaalde no-shows geregistreerd — online boeken is geblokkeerd. Verwijs door naar de salon.",
    };
  }

  // Every AI booking is a customer touchpoint — find-or-create the customer
  // record so the appointment links to it from the start (dossier, CRM,
  // no-show history and loyalty in later phases all key off customerId).
  const customer =
    existingCustomer ??
    (await upsertCustomerByPhone({
      salonId: input.salonId,
      phone: input.customerPhone,
      name: input.customerName,
      source: isPhone ? "ai_phone" : "ai_whatsapp",
    }));

  const deposit = isPhone
    ? { required: false, amountCents: 0 }
    : computeDepositRequirement(
        { depositRequired: input.depositRequired, depositCents: input.depositCents },
        treatmentRow[0]?.priceCents ?? 0,
      );

  // Middelburg-norm: WhatsApp bookings start unconfirmed and are pushed to
  // the external agenda only after the customer taps the confirm button —
  // see the WATI button_reply webhook. There's no equivalent tap on a phone
  // call, so a phone booking is confirmed immediately (the AI already got
  // verbal name/phone confirmation before calling this). A deposit-required
  // WhatsApp booking starts one step earlier still (pending_deposit) — see
  // below.
  const [row] = await db
    .insert(appointments)
    .values({
      salonId: input.salonId,
      customerId: customer.id,
      conversationId: input.conversationId ?? null,
      agendaProvider: input.agendaProvider ?? "manual",
      locationId: realId(decoded.locationId),
      staffId: realId(decoded.staffId),
      treatmentId: realId(decoded.treatmentId),
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      serviceType,
      appointmentTime,
      durationMinutes,
      source: isPhone ? "ai_phone" : "ai_whatsapp",
      cancellationDeadline,
      ...(isPhone
        ? { status: "confirmed" as const, policyAcceptedAt: new Date(), confirmationChannel: "voice" }
        : deposit.required
          ? { status: "pending_deposit" as const }
          : {}),
    })
    .returning();

  let depositPayment: { checkoutUrl: string; amountCents: number } | null = null;
  if (deposit.required) {
    const session = await createDepositCheckoutSession({
      appointmentId: row!.id,
      salonId: input.salonId,
      salonName: input.salonName,
      treatmentName: serviceType,
      amountCents: deposit.amountCents,
    });
    if (session) {
      depositPayment = { checkoutUrl: session.url, amountCents: deposit.amountCents };
    } else {
      // Stripe not configured — degrade to the normal Middelburg flow
      // instead of leaving the booking stuck in pending_deposit forever.
      await db.update(appointments).set({ status: "pending_confirmation" }).where(eq(appointments.id, row!.id));
    }
  }

  return {
    ok: true as const,
    appointmentId: row!.id,
    pendingConfirmation: !isPhone && !depositPayment,
    ...(depositPayment ? { depositPayment } : {}),
    treatment: serviceType,
    location: locationName,
    date: amsterdamDateKey(appointmentTime),
    time: amsterdamTimeKey(appointmentTime),
    cancellationDeadline: cancellationDeadline.toISOString(),
  };
}

export async function setExternalId(appointmentId: string, externalId: string): Promise<void> {
  await db.update(appointments).set({ externalId }).where(eq(appointments.id, appointmentId));
}

/**
 * Best-effort push of an already-confirmed booking to the salon's connected
 * agenda software. Used both by the WATI button-confirm webhook (WhatsApp,
 * Middelburg-norm) and immediately after a phone booking (no button to tap
 * mid-call, so the booking is confirmed the moment it's made). Never throws
 * — a failed push must not undo an appointment that's already confirmed to
 * the customer; it's captured for observability instead, and the appointment
 * simply stays without an externalId until fixed manually.
 */
export async function pushBookingToAgenda(
  agendaProvider: string | null | undefined,
  rawApiKey: string | null | undefined,
  appointmentId: string,
  booking: { customerName: string; customerPhone: string; serviceType: string; date: string; time: string },
): Promise<void> {
  try {
    const adapter = getAgendaAdapter(agendaProvider, resolveAgendaApiKey(rawApiKey));
    if (!adapter) return;
    const result = await adapter.bookAppointment(booking);
    if (result.ok) {
      if (result.externalId) await setExternalId(appointmentId, result.externalId);
    } else {
      captureError("agenda-sync/push-booking", new Error(result.error ?? "onbekende fout bij push naar agenda"));
    }
  } catch (err) {
    captureError("agenda-sync/push-booking", err);
  }
}

/**
 * Confirm a pending_confirmation appointment after the customer accepts the
 * cancellation policy (Middelburg-norm). Returns null if the appointment
 * doesn't exist or was already confirmed/cancelled — callers must not push
 * to the agenda adapter or resend confirmations in that case.
 */
export async function confirmAppointment(
  appointmentId: string,
  confirmationChannel: string,
): Promise<typeof appointments.$inferSelect | null> {
  const [existing] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.status, "pending_confirmation")))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(appointments)
    .set({
      status: "confirmed",
      policyAcceptedAt: new Date(),
      confirmationChannel,
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  return updated ?? null;
}

export async function rescheduleToSlot(salonId: string, appointmentId: string, newSlotId: string) {
  const decoded = decodeSlot(newSlotId);
  if (!decoded) return { error: "Ongeldig new_slot_id — gebruik een slot_id uit check_availability." };

  const [existing] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.salonId, salonId)))
    .limit(1);
  if (!existing) return { error: "Onbekend appointment_id." };

  const treatmentRow = realId(decoded.treatmentId)
    ? (await db.select().from(treatments).where(eq(treatments.id, decoded.treatmentId)).limit(1))[0]
    : undefined;
  const locationRow = realId(decoded.locationId)
    ? (await db.select().from(locations).where(eq(locations.id, decoded.locationId)).limit(1))[0]
    : undefined;

  await db
    .update(appointments)
    .set({
      locationId: realId(decoded.locationId),
      staffId: realId(decoded.staffId),
      treatmentId: realId(decoded.treatmentId),
      serviceType: treatmentRow?.name ?? existing.serviceType,
      durationMinutes: treatmentRow?.durationMinutes ?? existing.durationMinutes,
      appointmentTime: new Date(decoded.startISO),
    })
    .where(eq(appointments.id, appointmentId));

  return {
    ok: true as const,
    treatment: treatmentRow?.name ?? existing.serviceType,
    location: locationRow?.name ?? "Salon",
    date: amsterdamDateKey(new Date(decoded.startISO)),
    time: amsterdamTimeKey(new Date(decoded.startISO)),
  };
}

export async function cancelById(salonId: string, appointmentId: string) {
  const [existing] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.salonId, salonId)))
    .limit(1);
  if (!existing) return { error: "Onbekend appointment_id." };

  await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, appointmentId));

  return {
    ok: true as const,
    treatment: existing.serviceType,
    date: amsterdamDateKey(existing.appointmentTime),
    time: amsterdamTimeKey(existing.appointmentTime),
  };
}

export interface UpcomingAppointment {
  id: string;
  customerId: string | null;
  customerName: string;
  serviceType: string;
  locationName: string | null;
  appointmentTime: Date;
  durationMinutes: number;
  status: string;
  reminded: boolean;
}

/** For the dashboard — real bookings, most recent salons first have none yet. */
export async function listUpcomingAppointments(salonId: string, limit = 20): Promise<UpcomingAppointment[]> {
  const rows = await db
    .select({
      id: appointments.id,
      customerId: appointments.customerId,
      customerName: appointments.customerName,
      serviceType: appointments.serviceType,
      locationName: locations.name,
      appointmentTime: appointments.appointmentTime,
      durationMinutes: appointments.durationMinutes,
      status: appointments.status,
      reminderSentAt: appointments.reminderSentAt,
    })
    .from(appointments)
    .leftJoin(locations, eq(locations.id, appointments.locationId))
    .where(and(eq(appointments.salonId, salonId), gte(appointments.appointmentTime, new Date()), ne(appointments.status, "cancelled")))
    .orderBy(appointments.appointmentTime)
    .limit(limit);
  return rows.map((r) => ({ ...r, reminded: Boolean(r.reminderSentAt) }));
}

export interface CustomerAppointment {
  id: string;
  customerId: string | null;
  customerName: string;
  serviceType: string;
  staffName: string | null;
  appointmentTime: Date;
  durationMinutes: number;
  status: string;
}

/**
 * Vandaag-overzicht op /dashboard/klanten — de dagplanning van een kapper,
 * met customerId zodat elke rij direct naar het klantdossier kan linken.
 * Amsterdam-daggrens, niet server-local (zie lib/salon/timezone.ts).
 */
export async function listTodayAppointments(salonId: string): Promise<CustomerAppointment[]> {
  const now = new Date();
  const startOfDay = amsterdamWallTimeToUtc(now, 0, 0);
  const startOfNextDay = amsterdamWallTimeToUtc(now, 1, 0);

  return db
    .select({
      id: appointments.id,
      customerId: appointments.customerId,
      customerName: appointments.customerName,
      serviceType: appointments.serviceType,
      staffName: staff.name,
      appointmentTime: appointments.appointmentTime,
      durationMinutes: appointments.durationMinutes,
      status: appointments.status,
    })
    .from(appointments)
    .leftJoin(staff, eq(staff.id, appointments.staffId))
    .where(
      and(
        eq(appointments.salonId, salonId),
        gte(appointments.appointmentTime, startOfDay),
        lt(appointments.appointmentTime, startOfNextDay),
        ne(appointments.status, "cancelled"),
      ),
    )
    .orderBy(appointments.appointmentTime);
}

/** Afsprakenhistorie op een klantdossier — recentste eerst, inclusief toekomstige. */
export async function listAppointmentsForCustomer(
  salonId: string,
  customerId: string,
  limit = 20,
): Promise<CustomerAppointment[]> {
  return db
    .select({
      id: appointments.id,
      customerId: appointments.customerId,
      customerName: appointments.customerName,
      serviceType: appointments.serviceType,
      staffName: staff.name,
      appointmentTime: appointments.appointmentTime,
      durationMinutes: appointments.durationMinutes,
      status: appointments.status,
    })
    .from(appointments)
    .leftJoin(staff, eq(staff.id, appointments.staffId))
    .where(and(eq(appointments.salonId, salonId), eq(appointments.customerId, customerId)))
    .orderBy(desc(appointments.appointmentTime))
    .limit(limit);
}
