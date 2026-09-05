import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { computeAvailableSlots, encodeSlot, decodeSlot } from "@/lib/salon/availability";

// Fixed "now": Monday 2026-09-07 08:00 local — every test's working-hours
// window and lead-time math is computed relative to this.
const NOW = new Date(2026, 8, 7, 8, 0, 0);

const location = {
  id: "loc-1",
  name: "Den Bosch",
  workingHours: { mon: [9, 18], tue: [9, 18], wed: [9, 18], thu: [9, 18], fri: [9, 18], sat: [9, 13], sun: null } as Record<
    string,
    [number, number] | null
  >,
};
const treatment = { id: "treat-1", name: "Chemisch peeling", durationMinutes: 30, priceCents: 12000 };
const staffA = { id: "staff-a", name: "Sanne de Groot" };
const staffB = { id: "staff-b", name: "Mila van Dijk" };

describe("computeAvailableSlots", () => {
  it("only returns slots inside working hours, respecting the 1-hour lead time", () => {
    const slots = computeAvailableSlots({
      location,
      treatment,
      eligibleStaff: [staffA],
      existingAppointments: [],
      days: 1,
      now: NOW,
    });

    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      const hour = new Date(slot.startISO).getHours();
      expect(hour).toBeGreaterThanOrEqual(9);
      expect(hour).toBeLessThan(18);
    }
    // Nothing earlier than now + 60 minutes.
    const earliest = new Date(slots[0]!.startISO);
    expect(earliest.getTime()).toBeGreaterThanOrEqual(NOW.getTime() + 60 * 60_000);
  });

  it("skips a day the location is closed (Sunday)", () => {
    const sunday = new Date(2026, 8, 6, 8, 0, 0); // 2026-09-06 is a Sunday
    const slots = computeAvailableSlots({
      location,
      treatment,
      eligibleStaff: [staffA],
      existingAppointments: [],
      days: 1,
      now: sunday,
    });
    expect(slots).toEqual([]);
  });

  it("does not offer a slot that overlaps an existing booking for that staff member, plus a 15-minute buffer", () => {
    const busyAt = new Date(2026, 8, 7, 10, 0, 0); // mon 10:00–10:30
    const slots = computeAvailableSlots({
      location,
      treatment,
      eligibleStaff: [staffA],
      existingAppointments: [{ staffId: "staff-a", appointmentTime: busyAt, durationMinutes: 30 }],
      days: 1,
      now: NOW,
    });

    for (const slot of slots) {
      const start = new Date(slot.startISO).getTime();
      // Blocked window is 09:45–10:45 (30-min appt + 15-min buffer on both sides).
      const blockedStart = busyAt.getTime() - 15 * 60_000;
      const blockedEnd = busyAt.getTime() + 30 * 60_000 + 15 * 60_000;
      expect(start < blockedStart || start >= blockedEnd).toBe(true);
    }
  });

  it("keeps offering a busy staff member's colleague at the same time", () => {
    // A working-hours window narrow enough to produce exactly one candidate
    // slot per staff member, so the 8-slot cap can't hide the effect.
    const narrowLocation = { ...location, workingHours: { ...location.workingHours, mon: [10, 10.5] as [number, number] } };
    const busyAt = new Date(2026, 8, 7, 10, 0, 0);
    const slots = computeAvailableSlots({
      location: narrowLocation,
      treatment,
      eligibleStaff: [staffA, staffB],
      existingAppointments: [{ staffId: "staff-a", appointmentTime: busyAt, durationMinutes: 30 }],
      days: 1,
      now: NOW,
    });

    expect(slots.find((s) => s.staffId === "staff-a")).toBeUndefined();
    const atTenFromB = slots.find((s) => s.staffId === "staff-b" && new Date(s.startISO).getHours() === 10 && new Date(s.startISO).getMinutes() === 0);
    expect(atTenFromB).toBeDefined();
  });

  it("caps results at 8 slots", () => {
    const slots = computeAvailableSlots({
      location,
      treatment,
      eligibleStaff: [staffA, staffB],
      existingAppointments: [],
      days: 14,
      now: NOW,
    });
    expect(slots.length).toBeLessThanOrEqual(8);
  });
});

describe("computeAvailableSlots — Intelligent Double-Booking (gefaseerde behandeltijden)", () => {
  // Scenario A: staff-a has a color treatment 10:00–11:35 (30m aanbrengen,
  // 45m inwerktijd — stylist vrij, 20m afwerken). The processing window
  // (10:30–11:15) should be bookable for another treatment on the same
  // stylist without the usual 15-minute buffer, since it's not a stylist
  // transition — it's precise chemical timing.
  const colorAppointment = {
    staffId: "staff-a",
    appointmentTime: new Date(2026, 8, 7, 10, 0, 0), // mon 10:00
    durationMinutes: 95,
    applicationMinutes: 30,
    processingMinutes: 45,
    finishingMinutes: 20,
  };
  const narrowLocation = { ...location, workingHours: { ...location.workingHours, mon: [9, 12] as [number, number] } };

  it("offers a 30-minute haircut slot at 10:30, fully inside the 10:30–11:15 processing window", () => {
    const haircut = { id: "treat-knip", name: "Knipbeurt", durationMinutes: 30, priceCents: 3000 };
    const slots = computeAvailableSlots({
      location: narrowLocation,
      treatment: haircut,
      eligibleStaff: [staffA],
      existingAppointments: [colorAppointment],
      days: 1,
      now: NOW,
    });

    const at1030 = slots.find((s) => new Date(s.startISO).getHours() === 10 && new Date(s.startISO).getMinutes() === 30);
    expect(at1030).toBeDefined();
  });

  it("does not offer a 60-minute haircut at 10:30 — it would run into the finishing phase", () => {
    const longHaircut = { id: "treat-knip-lang", name: "Knip + styling", durationMinutes: 60, priceCents: 5000 };
    const slots = computeAvailableSlots({
      location: narrowLocation,
      treatment: longHaircut,
      eligibleStaff: [staffA],
      existingAppointments: [colorAppointment],
      days: 1,
      now: NOW,
    });

    const at1030 = slots.find((s) => new Date(s.startISO).getHours() === 10 && new Date(s.startISO).getMinutes() === 30);
    expect(at1030).toBeUndefined();
  });

  it("never offers a slot overlapping phase 1 (application, 10:00–10:30) or phase 3 (finishing, 11:15–11:35)", () => {
    const haircut = { id: "treat-knip", name: "Knipbeurt", durationMinutes: 30, priceCents: 3000 };
    const slots = computeAvailableSlots({
      location: narrowLocation,
      treatment: haircut,
      eligibleStaff: [staffA],
      existingAppointments: [colorAppointment],
      days: 1,
      now: NOW,
    });

    for (const slot of slots) {
      const start = new Date(slot.startISO).getTime();
      const end = start + haircut.durationMinutes * 60_000;
      const phase1 = [new Date(2026, 8, 7, 10, 0).getTime(), new Date(2026, 8, 7, 10, 30).getTime()];
      const phase3 = [new Date(2026, 8, 7, 11, 15).getTime(), new Date(2026, 8, 7, 11, 35).getTime()];
      const overlapsPhase1 = start < phase1[1]! && phase1[0]! < end;
      const overlapsPhase3 = start < phase3[1]! && phase3[0]! < end;
      expect(overlapsPhase1).toBe(false);
      expect(overlapsPhase3).toBe(false);
    }
  });

  it("treats a treatment without a full phase breakdown as one continuous block (no double-booking gap)", () => {
    // Only applicationMinutes set — not a valid phase breakdown, so the
    // whole 95-minute appointment should stay one busy block.
    const partiallyPhased = { ...colorAppointment, processingMinutes: undefined, finishingMinutes: undefined };
    const haircut = { id: "treat-knip", name: "Knipbeurt", durationMinutes: 30, priceCents: 3000 };
    const slots = computeAvailableSlots({
      location: narrowLocation,
      treatment: haircut,
      eligibleStaff: [staffA],
      existingAppointments: [partiallyPhased],
      days: 1,
      now: NOW,
    });

    const at1030 = slots.find((s) => new Date(s.startISO).getHours() === 10 && new Date(s.startISO).getMinutes() === 30);
    expect(at1030).toBeUndefined();
  });

  it("lets the double-booked treatment itself be phased, checking only its own busy segments against the gap", () => {
    // A second, shorter color touch-up (10m apply, 10m process, 5m finish)
    // dropped entirely inside the first client's 45-minute processing
    // window — every one of its own busy minutes must still fit inside it.
    const quickTouchUp = {
      id: "treat-touchup",
      name: "Uitgroei bijwerken",
      durationMinutes: 25,
      priceCents: 2000,
      applicationMinutes: 10,
      processingMinutes: 10,
      finishingMinutes: 5,
    };
    const slots = computeAvailableSlots({
      location: narrowLocation,
      treatment: quickTouchUp,
      eligibleStaff: [staffA],
      existingAppointments: [colorAppointment],
      days: 1,
      now: NOW,
    });

    const at1030 = slots.find((s) => new Date(s.startISO).getHours() === 10 && new Date(s.startISO).getMinutes() === 30);
    expect(at1030).toBeDefined();
  });
});

describe("slot id encode/decode", () => {
  it("round-trips location/treatment/staff/time through a slot id", () => {
    const id = encodeSlot("loc-1", "treat-1", "staff-a", "2026-09-10T14:00:00.000Z");
    expect(decodeSlot(id)).toEqual({
      locationId: "loc-1",
      treatmentId: "treat-1",
      staffId: "staff-a",
      startISO: "2026-09-10T14:00:00.000Z",
    });
  });

  it("rejects a malformed slot id instead of guessing", () => {
    expect(decodeSlot("not-a-real-slot-id")).toBeNull();
    expect(decodeSlot("")).toBeNull();
  });
});
