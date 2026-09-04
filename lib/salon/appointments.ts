import "server-only";
import { and, eq, gte, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, locations, staff, treatments } from "@/lib/db/schema";
import { decodeSlot } from "@/lib/salon/availability";
import { amsterdamDateKey, amsterdamTimeKey } from "@/lib/salon/timezone";

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
  slotId: string;
  customerName: string;
  customerPhone: string;
  conversationId?: string | null;
  agendaProvider: string | null;
  /** Uren vóór de afspraak waarbinnen kosteloos annuleren nog mag — bepaalt cancellationDeadline. Standaard 24. */
  freeCancelHours?: number;
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

  // Middelburg-norm: bookings start unconfirmed (default status) and are
  // pushed to the external agenda only after the customer accepts the
  // cancellation policy — see the WATI button_reply webhook.
  const [row] = await db
    .insert(appointments)
    .values({
      salonId: input.salonId,
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
      source: "ai_whatsapp",
      cancellationDeadline,
    })
    .returning();

  return {
    ok: true as const,
    appointmentId: row!.id,
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
