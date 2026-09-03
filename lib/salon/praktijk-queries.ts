import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { locations, treatments, staff, staffLocations, staffTreatments, knowledgeEntries } from "@/lib/db/schema";

export interface PraktijkData {
  locations: (typeof locations.$inferSelect)[];
  treatments: (typeof treatments.$inferSelect)[];
  staff: (typeof staff.$inferSelect & { locationIds: string[]; treatmentIds: string[] })[];
  knowledgeEntries: (typeof knowledgeEntries.$inferSelect)[];
}

export async function getPraktijkData(salonId: string): Promise<PraktijkData> {
  const [locationRows, treatmentRows, staffRows, knowledgeRows] = await Promise.all([
    db.select().from(locations).where(eq(locations.salonId, salonId)).orderBy(locations.createdAt),
    db.select().from(treatments).where(eq(treatments.salonId, salonId)).orderBy(treatments.createdAt),
    db.select().from(staff).where(eq(staff.salonId, salonId)).orderBy(staff.createdAt),
    db.select().from(knowledgeEntries).where(eq(knowledgeEntries.salonId, salonId)).orderBy(knowledgeEntries.createdAt),
  ]);

  const staffIds = staffRows.map((s) => s.id);
  const [staffLocRows, staffTreatRows] = await Promise.all([
    staffIds.length ? db.select().from(staffLocations).where(inArray(staffLocations.staffId, staffIds)) : Promise.resolve([]),
    staffIds.length ? db.select().from(staffTreatments).where(inArray(staffTreatments.staffId, staffIds)) : Promise.resolve([]),
  ]);

  const locIdsByStaff = new Map<string, string[]>();
  for (const row of staffLocRows) {
    const list = locIdsByStaff.get(row.staffId) ?? [];
    list.push(row.locationId);
    locIdsByStaff.set(row.staffId, list);
  }
  const treatIdsByStaff = new Map<string, string[]>();
  for (const row of staffTreatRows) {
    const list = treatIdsByStaff.get(row.staffId) ?? [];
    list.push(row.treatmentId);
    treatIdsByStaff.set(row.staffId, list);
  }

  return {
    locations: locationRows,
    treatments: treatmentRows,
    staff: staffRows.map((s) => ({ ...s, locationIds: locIdsByStaff.get(s.id) ?? [], treatmentIds: treatIdsByStaff.get(s.id) ?? [] })),
    knowledgeEntries: knowledgeRows,
  };
}
