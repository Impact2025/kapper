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
