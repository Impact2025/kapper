import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  salons,
  locations,
  treatments,
  staff,
  staffLocations,
  staffTreatments,
  knowledgeEntries,
} from "@/lib/db/schema";
import type { SalonContext } from "@/lib/ai/receptionist";

/**
 * Loads everything `getReceptionistReply` needs for one salon: the salon
 * row itself, its practice configuration (locations/treatments/team) and
 * its knowledge base. `lib/salon/availability.ts` already synthesizes a
 * sensible default when locations/treatments are empty, so this loader
 * just passes through whatever rows exist — no salon is left unbookable
 * for not having filled in /dashboard/praktijk yet.
 */
export async function loadSalonContext(
  salonRow: typeof salons.$inferSelect,
): Promise<SalonContext> {
  const salonId = salonRow.id;

  const [locationRows, treatmentRows, staffRows] = await Promise.all([
    db.select().from(locations).where(eq(locations.salonId, salonId)),
    db.select().from(treatments).where(eq(treatments.salonId, salonId)),
    db.select().from(staff).where(eq(staff.salonId, salonId)),
  ]);
  const staffIds = staffRows.map((s) => s.id);

  const [staffLocRows, staffTreatRows, knowledgeRows] = await Promise.all([
    staffIds.length
      ? db.select().from(staffLocations).where(inArray(staffLocations.staffId, staffIds))
      : Promise.resolve([]),
    staffIds.length
      ? db.select().from(staffTreatments).where(inArray(staffTreatments.staffId, staffIds))
      : Promise.resolve([]),
    db.select().from(knowledgeEntries).where(eq(knowledgeEntries.salonId, salonId)),
  ]);

  const locationIdsByStaff = new Map<string, string[]>();
  for (const row of staffLocRows) {
    const list = locationIdsByStaff.get(row.staffId) ?? [];
    list.push(row.locationId);
    locationIdsByStaff.set(row.staffId, list);
  }
  const treatmentIdsByStaff = new Map<string, string[]>();
  for (const row of staffTreatRows) {
    const list = treatmentIdsByStaff.get(row.staffId) ?? [];
    list.push(row.treatmentId);
    treatmentIdsByStaff.set(row.staffId, list);
  }

  const ai = (salonRow.settings?.ai as Record<string, unknown>) ?? {};
  const noShow = (salonRow.settings?.noShow as Record<string, unknown>) ?? {};

  return {
    id: salonId,
    name: salonRow.name,
    city: salonRow.city,
    phone: salonRow.phone,
    plan: salonRow.plan,
    agendaProvider: salonRow.agendaProvider,
    aiSettings: {
      agendaApiKey: ai.agendaApiKey as string | null | undefined,
      watiApiKey: ai.watiApiKey as string | null | undefined,
      phoneNumber: ai.phoneNumber as string | null | undefined,
      whatsappEnabled: Boolean(ai.whatsappEnabled),
      phoneEnabled: Boolean(ai.phoneEnabled),
    },
    noShowSettings: {
      enabled: Boolean(noShow.enabled),
      freeCancelHours: Number(noShow.freeCancelHours ?? 24),
      chargePercent: Number(noShow.chargePercent ?? 100),
    },
    locations: locationRows
      .filter((l) => l.active)
      .map((l) => ({ id: l.id, name: l.name, city: l.city, workingHours: l.workingHours })),
    treatments: treatmentRows
      .filter((t) => t.active)
      .map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        durationMinutes: t.durationMinutes,
        priceCents: t.priceCents,
        description: t.description,
        prepInfo: t.prepInfo,
        aftercareInfo: t.aftercareInfo,
      })),
    staff: staffRows
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        locationIds: locationIdsByStaff.get(s.id) ?? [],
        treatmentIds: treatmentIdsByStaff.get(s.id) ?? [],
      })),
    knowledgeEntries: knowledgeRows
      .filter((k) => k.active)
      .map((k) => ({ title: k.title, content: k.content, category: k.category })),
  };
}
