import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  locations,
  staff,
  staffLocations,
  staffTreatments,
  treatments,
} from "@/lib/db/schema";
import { amsterdamDateKey, amsterdamDayOfWeek, amsterdamTimeKey, amsterdamWallTimeToUtc } from "@/lib/salon/timezone";

const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const DEFAULT_HOURS: Record<string, [number, number] | null> = {
  mon: [9, 18],
  tue: [9, 18],
  wed: [9, 18],
  thu: [9, 18],
  fri: [9, 18],
  sat: [9, 18],
  sun: null,
};
const SLOT_STEP_MIN = 30;
const BUFFER_MIN = 15;
const MIN_LEAD_MIN = 60;
const MAX_SLOTS = 8;

export interface AvailableSlot {
  slotId: string;
  locationId: string;
  treatmentId: string;
  staffId: string;
  staffName: string;
  locationName: string;
  treatmentName: string;
  durationMinutes: number;
  priceCents: number;
  date: string; // ISO date
  time: string; // "HH:MM"
  startISO: string;
}

export interface DecodedSlot {
  locationId: string;
  treatmentId: string;
  staffId: string;
  startISO: string;
}

export function encodeSlot(locationId: string, treatmentId: string, staffId: string, startISO: string): string {
  return [locationId, treatmentId, staffId, startISO].join("::");
}

export function decodeSlot(slotId: string): DecodedSlot | null {
  const parts = String(slotId || "").split("::");
  if (parts.length !== 4) return null;
  const [locationId, treatmentId, staffId, startISO] = parts;
  if (!locationId || !treatmentId || !staffId || !startISO) return null;
  return { locationId, treatmentId, staffId, startISO };
}

interface TreatmentPhases {
  applicationMinutes?: number | null;
  processingMinutes?: number | null;
  finishingMinutes?: number | null;
}

interface BusySegment {
  startMin: number;
  endMin: number;
}

/** A treatment is "phased" only when all three legs are set and the
 * processing leg actually leaves a gap — otherwise it's just one block. */
function isPhasedTreatment(t: TreatmentPhases): boolean {
  return (t.applicationMinutes ?? 0) > 0 && (t.processingMinutes ?? 0) > 0 && (t.finishingMinutes ?? 0) > 0;
}

/**
 * Intelligent Double-Booking (Pro): a phased treatment (e.g. hair color)
 * only occupies the stylist during application and finishing — the
 * processing/inwerktijd window in between is free for another client. A
 * treatment without a full phase breakdown stays one continuous busy block.
 */
function busySegments(startMin: number, durationMinutes: number, phases: TreatmentPhases): BusySegment[] {
  if (!isPhasedTreatment(phases)) return [{ startMin, endMin: startMin + durationMinutes }];
  const phase1End = startMin + phases.applicationMinutes!;
  const phase2End = phase1End + phases.processingMinutes!;
  const phase3End = phase2End + phases.finishingMinutes!;
  return [
    { startMin, endMin: phase1End },
    { startMin: phase2End, endMin: phase3End },
  ];
}

function segmentsOverlap(a: BusySegment, b: BusySegment): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/**
 * A salon with no `locations` rows yet (every existing customer, today)
 * still needs to work — synthesize one implicit location from the salon
 * itself rather than forcing a migration step before anyone can book.
 */
export function implicitLocation(salonId: string, salonName: string, salonCity: string | null) {
  return {
    id: `__implicit__${salonId}`,
    salonId,
    name: salonName,
    city: salonCity,
    address: null as string | null,
    workingHours: DEFAULT_HOURS,
    active: true,
    createdAt: new Date(),
  };
}

/** A salon with no `treatments` configured yet still needs to be bookable. */
export function implicitTreatment(salonId: string) {
  return {
    id: `__implicit__${salonId}`,
    salonId,
    name: "Afspraak",
    category: null as string | null,
    durationMinutes: 30,
    applicationMinutes: null as number | null,
    processingMinutes: null as number | null,
    finishingMinutes: null as number | null,
    priceCents: 0,
    description: null as string | null,
    prepInfo: null as string | null,
    aftercareInfo: null as string | null,
    active: true,
    createdAt: new Date(),
  };
}

export interface AvailabilityLocation {
  id: string;
  name: string;
  workingHours: Record<string, [number, number] | null>;
}
export interface AvailabilityTreatment extends TreatmentPhases {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}
export interface AvailabilityStaff {
  id: string;
  name: string;
}
export interface AvailabilityAppointment extends TreatmentPhases {
  staffId: string | null;
  appointmentTime: Date;
  durationMinutes: number;
}

export interface ComputeSlotsInput {
  location: AvailabilityLocation;
  treatment: AvailabilityTreatment;
  eligibleStaff: AvailabilityStaff[];
  existingAppointments: AvailabilityAppointment[];
  days?: number;
  now?: Date;
}

/**
 * Pure slot generator — no DB access, easy to unit test. Given a location's
 * working hours, a treatment's duration, the staff eligible to perform it,
 * and already-booked appointments for those staff, produce up to
 * `MAX_SLOTS` bookable slots with a 15-minute buffer around existing
 * bookings and at least an hour of lead time from `now`.
 */
export function computeAvailableSlots(input: ComputeSlotsInput): AvailableSlot[] {
  const { location, treatment, eligibleStaff, existingAppointments, days, now = new Date() } = input;
  const nDays = Math.min(Math.max(Number(days) || 10, 1), 14);
  const workingHours = location.workingHours ?? DEFAULT_HOURS;

  const results: AvailableSlot[] = [];
  outer: for (let d = 0; d < nDays; d++) {
    // Working hours are Amsterdam wall-clock hours regardless of which
    // timezone this process happens to run in (a laptop vs. Vercel's UTC
    // functions) — resolve the day-of-week the same way.
    const dayStartUtc = amsterdamWallTimeToUtc(now, d, 0);
    const hours = workingHours[DOW_KEYS[amsterdamDayOfWeek(dayStartUtc)]!];
    if (!hours) continue;

    for (const member of eligibleStaff) {
      for (let mins = hours[0] * 60; mins + treatment.durationMinutes <= hours[1] * 60; mins += SLOT_STEP_MIN) {
        const start = amsterdamWallTimeToUtc(now, d, mins);
        if (start.getTime() < now.getTime() + MIN_LEAD_MIN * 60_000) continue;

        const candidateSegments = busySegments(start.getTime() / 60_000, treatment.durationMinutes, treatment);
        const conflict = existingAppointments.some((a) => {
          if (a.staffId !== member.id) return false;
          const aStartMin = a.appointmentTime.getTime() / 60_000;
          const phased = isPhasedTreatment(a);
          const existingSegs = busySegments(aStartMin, a.durationMinutes ?? 30, a);
          // Buffer time between distinct bookings only applies to a plain
          // continuous block — a phased treatment's processing window is a
          // precise chemical timing, not a stylist transition, so a
          // parallel booking may butt right up against its boundaries.
          const buffered = phased
            ? existingSegs
            : existingSegs.map((s) => ({ startMin: s.startMin - BUFFER_MIN, endMin: s.endMin + BUFFER_MIN }));
          return buffered.some((es) => candidateSegments.some((cs) => segmentsOverlap(es, cs)));
        });
        if (conflict) continue;

        results.push({
          slotId: encodeSlot(location.id, treatment.id, member.id, start.toISOString()),
          locationId: location.id,
          treatmentId: treatment.id,
          staffId: member.id,
          staffName: member.name,
          locationName: location.name,
          treatmentName: treatment.name,
          durationMinutes: treatment.durationMinutes,
          priceCents: treatment.priceCents,
          date: amsterdamDateKey(start),
          time: amsterdamTimeKey(start),
          startISO: start.toISOString(),
        });
        if (results.length >= MAX_SLOTS) break outer;
      }
    }
  }
  return results;
}

interface FindSlotsInput {
  salonId: string;
  salonName: string;
  salonCity: string | null;
  locationId: string;
  treatmentId: string;
  staffName?: string;
  days?: number;
}

export interface FindSlotsResult {
  location: string;
  treatment: string;
  slots: AvailableSlot[];
  note?: string;
}

/** DB-backed wrapper around {@link computeAvailableSlots}. */
export async function findAvailableSlots(input: FindSlotsInput): Promise<FindSlotsResult> {
  const { salonId, salonName, salonCity, locationId, treatmentId, staffName, days } = input;

  const [locRows, treatRows] = await Promise.all([
    db.select().from(locations).where(eq(locations.salonId, salonId)),
    db.select().from(treatments).where(eq(treatments.salonId, salonId)),
  ]);

  const allLocations = locRows.length ? locRows : [implicitLocation(salonId, salonName, salonCity)];
  const allTreatments = treatRows.length ? treatRows : [implicitTreatment(salonId)];

  const location = allLocations.find((l) => l.id === locationId);
  const treatment = allTreatments.find((t) => t.id === treatmentId);
  if (!location) return { location: "onbekend", treatment: "onbekend", slots: [], note: "Onbekende vestiging." };
  if (!treatment) return { location: location.name, treatment: "onbekend", slots: [], note: "Onbekende behandeling." };

  let qualifiedStaffIds: Set<string> | null = null;
  if (locRows.length && treatRows.length) {
    // Real practice data configured: staff must be explicitly qualified.
    const [locLinks, treatLinks] = await Promise.all([
      db.select().from(staffLocations).where(eq(staffLocations.locationId, locationId)),
      db.select().from(staffTreatments).where(eq(staffTreatments.treatmentId, treatmentId)),
    ]);
    const atLocation = new Set(locLinks.map((r) => r.staffId));
    const canTreat = new Set(treatLinks.map((r) => r.staffId));
    qualifiedStaffIds = new Set([...atLocation].filter((id) => canTreat.has(id)));
  }

  let staffRows = await db.select().from(staff).where(and(eq(staff.salonId, salonId), eq(staff.active, true)));
  if (qualifiedStaffIds) {
    staffRows = staffRows.filter((s) => qualifiedStaffIds!.has(s.id));
  } else if (!staffRows.length) {
    // No team configured at all yet — synthesize one generic staff slot so
    // a brand-new salon can still take bookings.
    staffRows = [{ id: `__implicit__${salonId}`, salonId, name: "Salon", role: null, active: true, createdAt: new Date() }];
  }

  if (staffName) {
    const needle = staffName.toLowerCase();
    const filtered = staffRows.filter((s) => s.name.toLowerCase().includes(needle));
    if (filtered.length) staffRows = filtered;
  }

  if (!staffRows.length) {
    return {
      location: location.name,
      treatment: treatment.name,
      slots: [],
      note: "Geen behandelaar bij deze vestiging is bevoegd voor deze behandeling.",
    };
  }

  const staffIds = staffRows.map((s) => s.id);
  const existing = staffIds.length
    ? await db.select().from(appointments).where(
        and(inArray(appointments.staffId, staffIds), ne(appointments.status, "cancelled")),
      )
    : [];

  // Existing appointments only carry their own durationMinutes — look up
  // the booked treatment's phase breakdown so a color appointment's
  // processing window can free up the stylist for a double-booking.
  const treatmentsById = new Map(allTreatments.map((t) => [t.id, t]));

  const slots = computeAvailableSlots({
    location: { id: location.id, name: location.name, workingHours: location.workingHours as Record<string, [number, number] | null> },
    treatment: {
      id: treatment.id,
      name: treatment.name,
      durationMinutes: treatment.durationMinutes,
      priceCents: treatment.priceCents,
      applicationMinutes: treatment.applicationMinutes,
      processingMinutes: treatment.processingMinutes,
      finishingMinutes: treatment.finishingMinutes,
    },
    eligibleStaff: staffRows.map((s) => ({ id: s.id, name: s.name })),
    existingAppointments: existing.map((a) => {
      const bookedTreatment = a.treatmentId ? treatmentsById.get(a.treatmentId) : undefined;
      return {
        staffId: a.staffId,
        appointmentTime: new Date(a.appointmentTime),
        durationMinutes: a.durationMinutes,
        applicationMinutes: bookedTreatment?.applicationMinutes,
        processingMinutes: bookedTreatment?.processingMinutes,
        finishingMinutes: bookedTreatment?.finishingMinutes,
      };
    }),
    days,
  });

  return { location: location.name, treatment: treatment.name, slots };
}
