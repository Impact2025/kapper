import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatuses,
  computeDocumentTotals,
  lineNetCents,
  formatNumber,
  invoicePaymentState,
  isQuoteExpired,
  addMonths,
  addDays,
  contractNeedsGeneration,
  advanceDue,
  normalizePostalCode,
  formatAddressLine,
  detectUrgency,
  buildChecklist,
  checklistProgress,
  compareJobsForBoard,
  blocksOverlap,
  customerDisplayName,
} from "@/lib/jobs/model";

describe("job status machine", () => {
  it("allows the normal happy path", () => {
    expect(canTransition("new", "scheduled")).toBe(true);
    expect(canTransition("scheduled", "en_route")).toBe(true);
    expect(canTransition("en_route", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
    expect(canTransition("completed", "invoiced")).toBe(true);
    expect(canTransition("invoiced", "paid")).toBe(true);
  });

  it("blocks skipping straight from new to completed", () => {
    expect(canTransition("new", "completed")).toBe(false);
    expect(canTransition("new", "paid")).toBe(false);
  });

  it("treats paid as terminal but lets a cancelled klus be reopened", () => {
    expect(nextStatuses("paid")).toEqual([]);
    expect(canTransition("cancelled", "new")).toBe(true);
  });

  it("same-status is always allowed (idempotent update)", () => {
    expect(canTransition("paid", "paid")).toBe(true);
  });
});

describe("computeDocumentTotals", () => {
  it("adds btw per rate group, not per line", () => {
    const t = computeDocumentTotals([
      { quantity: 1.5, unitPriceCents: 7500, vatRatePercent: 21 }, // 11250
      { quantity: 1, unitPriceCents: 3500, vatRatePercent: 21 }, // 3500
      { quantity: 2, unitPriceCents: 1999, vatRatePercent: 9 }, // 3998
    ]);
    expect(t.breakdown).toEqual([
      { ratePercent: 21, netCents: 14750, vatCents: 3098 }, // 3097.5 → 3098
      { ratePercent: 9, netCents: 3998, vatCents: 360 }, // 359.82 → 360
    ]);
    expect(t.subtotalCents).toBe(18748);
    expect(t.vatCents).toBe(3458);
    expect(t.totalCents).toBe(22206);
  });

  it("handles an empty document and 0% (verlegd)", () => {
    expect(computeDocumentTotals([]).totalCents).toBe(0);
    const t = computeDocumentTotals([{ quantity: 1, unitPriceCents: 10000, vatRatePercent: 0 }]);
    expect(t.vatCents).toBe(0);
    expect(t.totalCents).toBe(10000);
  });

  it("rounds a fractional quantity to whole cents per line", () => {
    expect(lineNetCents({ quantity: 0.33, unitPriceCents: 1000 })).toBe(330);
    expect(lineNetCents({ quantity: 2.5, unitPriceCents: 333 })).toBe(833); // 832.5 → 833
  });
});

describe("numbering", () => {
  it("formats prefixes per kind and zero-pads", () => {
    expect(formatNumber("job", 2026, 7)).toBe("K-2026-0007");
    expect(formatNumber("quote", 2026, 12)).toBe("O-2026-0012");
    expect(formatNumber("invoice", 2027, 1234)).toBe("F-2027-1234");
  });
});

describe("invoice payment state", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  it("is overdue only for sent invoices past the due date", () => {
    expect(invoicePaymentState({ status: "sent", dueAt: new Date("2026-10-01T00:00:00Z") }, now)).toBe("overdue");
    expect(invoicePaymentState({ status: "sent", dueAt: new Date("2026-10-20T00:00:00Z") }, now)).toBe("open");
    expect(invoicePaymentState({ status: "paid", dueAt: new Date("2026-01-01T00:00:00Z") }, now)).toBe("paid");
    expect(invoicePaymentState({ status: "draft", dueAt: null }, now)).toBe("draft");
  });
  it("flags an unanswered quote as expired after validUntil", () => {
    expect(isQuoteExpired({ status: "sent", validUntil: new Date("2026-10-01T00:00:00Z") }, now)).toBe(true);
    expect(isQuoteExpired({ status: "accepted", validUntil: new Date("2026-10-01T00:00:00Z") }, now)).toBe(false);
  });
});

describe("date math", () => {
  it("addMonths clamps to month end instead of rolling over", () => {
    expect(addMonths(new Date("2026-01-31T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(addMonths(new Date("2028-01-31T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2028-02-29");
    expect(addMonths(new Date("2026-10-15T00:00:00Z"), 12).toISOString().slice(0, 10)).toBe("2027-10-15");
  });
  it("addDays crosses month boundaries", () => {
    expect(addDays(new Date("2026-10-30T00:00:00Z"), 3).toISOString().slice(0, 10)).toBe("2026-11-02");
  });
});

describe("service contracts", () => {
  const base = { status: "active", leadDays: 30, lastGeneratedForDue: null as Date | null };
  const due = new Date("2026-11-15T00:00:00Z");

  it("generates inside the lead window, not before", () => {
    expect(contractNeedsGeneration({ ...base, nextDueAt: due }, new Date("2026-10-10T00:00:00Z"))).toBe(false);
    expect(contractNeedsGeneration({ ...base, nextDueAt: due }, new Date("2026-10-20T00:00:00Z"))).toBe(true);
  });

  it("never generates twice for the same due date", () => {
    expect(
      contractNeedsGeneration({ ...base, nextDueAt: due, lastGeneratedForDue: due }, new Date("2026-11-01T00:00:00Z")),
    ).toBe(false);
  });

  it("ignores paused/ended contracts", () => {
    expect(contractNeedsGeneration({ ...base, status: "paused", nextDueAt: due }, new Date("2026-11-14T00:00:00Z"))).toBe(false);
  });

  it("advanceDue skips missed cycles instead of backfilling", () => {
    const next = advanceDue(new Date("2024-03-01T00:00:00Z"), 12, new Date("2026-10-10T00:00:00Z"));
    expect(next.toISOString().slice(0, 10)).toBe("2027-03-01");
  });
});

describe("addresses", () => {
  it("normalizes Dutch postal codes", () => {
    expect(normalizePostalCode("1234ab")).toBe("1234 AB");
    expect(normalizePostalCode(" 1234 aB ")).toBe("1234 AB");
    expect(normalizePostalCode("12345")).toBeNull();
    expect(normalizePostalCode("abcd")).toBeNull();
  });
  it("formats a one-line address", () => {
    expect(formatAddressLine({ street: "Zeestraat", houseNumber: "12 B", postalCode: "1234 AB", city: "Middelburg" })).toBe(
      "Zeestraat 12 B, 1234 AB Middelburg",
    );
  });
  it("shows company first for zakelijke klanten", () => {
    expect(customerDisplayName({ name: "Jan", companyName: "Bakkerij De Ster" })).toBe("Bakkerij De Ster (Jan)");
    expect(customerDisplayName({ name: "Jan" })).toBe("Jan");
  });
});

describe("spoed detection", () => {
  it("catches safety and water-damage signals", () => {
    expect(detectUrgency("Ik ruik gas in de keuken")).toBe("urgent");
    expect(detectUrgency("Er komt water door het plafond")).toBe("urgent");
  });
  it("honours a negated spoed", () => {
    expect(detectUrgency("geen spoed, volgende week is prima")).toBe("normal");
    expect(detectUrgency("niet dringend")).toBe("normal");
  });
  it("falls back to the category's urgency", () => {
    expect(detectUrgency("kraan druppelt", true)).toBe("urgent");
    expect(detectUrgency("kraan druppelt", false)).toBe("normal");
  });
});

describe("checklist", () => {
  it("builds stable ids and tracks progress", () => {
    const items = buildChecklist(["a", "b", "c"]);
    expect(items.map((i) => i.id)).toEqual(["c1", "c2", "c3"]);
    items[1]!.done = true;
    expect(checklistProgress(items)).toEqual({ done: 1, total: 3 });
  });
});

describe("board ordering + overlap", () => {
  const d = (s: string) => new Date(s);
  it("puts spoed first, then earliest planned", () => {
    const jobs = [
      { id: "n", priority: "normal", scheduledStart: d("2026-10-10T08:00:00Z"), createdAt: d("2026-10-01T00:00:00Z") },
      { id: "u", priority: "urgent", scheduledStart: null, createdAt: d("2026-10-05T00:00:00Z") },
      { id: "n2", priority: "normal", scheduledStart: d("2026-10-09T08:00:00Z"), createdAt: d("2026-10-02T00:00:00Z") },
    ];
    expect([...jobs].sort(compareJobsForBoard).map((j) => j.id)).toEqual(["u", "n2", "n"]);
  });
  it("detects overlapping blocks", () => {
    const a = { start: d("2026-10-10T08:00:00Z"), minutes: 60 };
    expect(blocksOverlap(a, { start: d("2026-10-10T08:30:00Z"), minutes: 60 })).toBe(true);
    expect(blocksOverlap(a, { start: d("2026-10-10T09:00:00Z"), minutes: 60 })).toBe(false);
  });
});

import { parseAmsterdamLocal, toAmsterdamLocalInput, parseDateInput, startOfAmsterdamWeek } from "@/lib/jobs/datetime";
import { formatMoney, reminderDue } from "@/lib/jobs/model";
import { isValidIban, formatIban, isValidVatNumber, isValidKvk, parseBusinessProfile, missingInvoiceFields } from "@/lib/jobs/business";

describe("Amsterdam datetime-local handling", () => {
  it("reads winter time (CET, UTC+1)", () => {
    expect(parseAmsterdamLocal("2026-12-01T09:30")?.toISOString()).toBe("2026-12-01T08:30:00.000Z");
  });
  it("reads summer time (CEST, UTC+2)", () => {
    expect(parseAmsterdamLocal("2026-07-01T09:30")?.toISOString()).toBe("2026-07-01T07:30:00.000Z");
  });
  it("round-trips through the input format", () => {
    const d = parseAmsterdamLocal("2026-10-12T14:05")!;
    expect(toAmsterdamLocalInput(d)).toBe("2026-10-12T14:05");
  });
  it("rejects garbage and impossible dates", () => {
    expect(parseAmsterdamLocal("")).toBeNull();
    expect(parseAmsterdamLocal("2026-02-31T10:00")).toBeNull();
    expect(parseAmsterdamLocal("2026-10-12T25:00")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
    expect(parseDateInput("2026-10-12")?.toISOString().slice(0, 10)).toBe("2026-10-12");
  });
  it("finds Monday of the week (Sunday belongs to the previous week)", () => {
    // 2026-10-14 is a Wednesday; Monday is 2026-10-12 00:00 Amsterdam (CEST) = 2026-10-11T22:00Z
    expect(startOfAmsterdamWeek(new Date("2026-10-14T10:00:00Z")).toISOString()).toBe("2026-10-11T22:00:00.000Z");
    // 2026-10-18 is a Sunday → still the week of Monday 12th
    expect(startOfAmsterdamWeek(new Date("2026-10-18T10:00:00Z")).toISOString()).toBe("2026-10-11T22:00:00.000Z");
  });
});

describe("money + payment reminders", () => {
  it("formats cents as euros with decimals", () => {
    expect(formatMoney(123450).replace(/\s/g, " ")).toMatch(/1\.234,50/);
  });
  it("sends reminders at +1, +8 and +15 days, max three", () => {
    const due = new Date("2026-10-01T00:00:00Z");
    const base = { status: "sent", dueAt: due };
    expect(reminderDue({ ...base, reminderCount: 0 }, new Date("2026-10-01T12:00:00Z"))).toBe(false);
    expect(reminderDue({ ...base, reminderCount: 0 }, new Date("2026-10-02T12:00:00Z"))).toBe(true);
    expect(reminderDue({ ...base, reminderCount: 1 }, new Date("2026-10-05T00:00:00Z"))).toBe(false);
    expect(reminderDue({ ...base, reminderCount: 1 }, new Date("2026-10-09T00:00:00Z"))).toBe(true);
    expect(reminderDue({ ...base, reminderCount: 3 }, new Date("2027-01-01T00:00:00Z"))).toBe(false);
    expect(reminderDue({ status: "paid", dueAt: due, reminderCount: 0 }, new Date("2026-12-01T00:00:00Z"))).toBe(false);
  });
});

describe("business profile", () => {
  it("validates IBAN with mod-97", () => {
    expect(isValidIban("NL91 ABNA 0417 1643 00")).toBe(true);
    expect(isValidIban("nl91abna0417164300")).toBe(true);
    expect(isValidIban("NL91 ABNA 0417 1643 01")).toBe(false);
    expect(isValidIban("hello")).toBe(false);
    expect(formatIban("nl91abna0417164300")).toBe("NL91 ABNA 0417 1643 00");
  });
  it("validates btw-id and KvK formats", () => {
    expect(isValidVatNumber("NL123456789B01")).toBe(true);
    expect(isValidVatNumber("nl 123456789 b01")).toBe(true);
    expect(isValidVatNumber("NL12345678B01")).toBe(false);
    expect(isValidKvk("12345678")).toBe(true);
    expect(isValidKvk("1234567")).toBe(false);
  });
  it("lists what a factuur still lacks", () => {
    const empty = parseBusinessProfile({}, "Loodgieter Jansen");
    expect(empty.companyName).toBe("Loodgieter Jansen");
    expect(missingInvoiceFields(empty)).toEqual(["adres", "KvK-nummer", "btw-nummer", "IBAN"]);
    const full = parseBusinessProfile({
      business: { kvk: "12345678", vatNumber: "NL123456789B01", iban: "NL91ABNA0417164300", street: "Zeestraat 1", postalCode: "1234 AB", city: "Middelburg" },
    }, "X");
    expect(missingInvoiceFields(full)).toEqual([]);
    expect(full.paymentTermDays).toBe(14);
    expect(full.quoteValidDays).toBe(30);
  });
  it("clamps silly payment terms", () => {
    expect(parseBusinessProfile({ business: { paymentTermDays: 9999 } }).paymentTermDays).toBe(120);
    expect(parseBusinessProfile({ business: { paymentTermDays: "abc" } }).paymentTermDays).toBe(14);
  });
});
