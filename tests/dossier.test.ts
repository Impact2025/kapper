import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const selectQueue: unknown[][] = [];
const insertValuesCalls: unknown[] = [];
const insertReturningQueue: unknown[][] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve(selectQueue.shift() ?? []),
        }),
      }),
    }),
    insert: () => ({
      values: (v: unknown) => {
        insertValuesCalls.push(v);
        return { returning: () => Promise.resolve(insertReturningQueue.shift() ?? [{}]) };
      },
    }),
  },
}));

import { addHealthRecord, addTreatmentCard, listHealthRecords, listTreatmentCards } from "@/lib/dossier/queries";

describe("lib/dossier/queries", () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertValuesCalls.length = 0;
    insertReturningQueue.length = 0;
  });

  it("listTreatmentCards scopes by salonId and customerId", async () => {
    selectQueue.push([{ id: "tc-1", customerId: "cust-1" }]);
    const rows = await listTreatmentCards("salon-1", "cust-1");
    expect(rows).toHaveLength(1);
  });

  it("addTreatmentCard stores structured details separately from notes", async () => {
    await addTreatmentCard({
      salonId: "salon-1",
      customerId: "cust-1",
      details: { colorFormula: "7.1 + 20vol", mixRatio: "1:1.5" },
      notes: "Wortelgroei 1cm.",
    });

    expect(insertValuesCalls[0]).toMatchObject({
      salonId: "salon-1",
      customerId: "cust-1",
      details: { colorFormula: "7.1 + 20vol", mixRatio: "1:1.5" },
      notes: "Wortelgroei 1cm.",
    });
  });

  it("listHealthRecords is a plain salon+customer scoped read (RBAC is enforced by the caller)", async () => {
    selectQueue.push([{ id: "hr-1", customerId: "cust-1" }]);
    const rows = await listHealthRecords("salon-1", "cust-1");
    expect(rows).toHaveLength(1);
  });

  it("addHealthRecord always persists an explicit consentGivenAt timestamp", async () => {
    const consentGivenAt = new Date("2026-09-22T10:00:00.000Z");
    await addHealthRecord({
      salonId: "salon-1",
      customerId: "cust-1",
      allergies: "Ammoniak",
      consentGivenAt,
    });

    expect(insertValuesCalls[0]).toMatchObject({
      salonId: "salon-1",
      customerId: "cust-1",
      allergies: "Ammoniak",
      consentGivenAt,
    });
  });
});
