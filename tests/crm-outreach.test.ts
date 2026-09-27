import { describe, expect, it } from "vitest";
import { fillPlaceholders, skipReason, unknownPlaceholders } from "@/lib/crm/outreach-template";

const vars = { naam: "Groen & Zo", plaats: "Haarlem", merk: "HovenierAssistent", site: "https://www.hovenierassistent.nl" };

describe("fillPlaceholders", () => {
  it("vervangt alle bekende placeholders, ook met spaties", () => {
    expect(fillPlaceholders("Hoi {{naam}} uit {{ plaats }}, groet {{merk}} ({{site}})", vars)).toBe(
      "Hoi Groen & Zo uit Haarlem, groet HovenierAssistent (https://www.hovenierassistent.nl)",
    );
  });

  it("valt terug op 'je regio' zonder plaats", () => {
    expect(fillPlaceholders("in {{plaats}}", { ...vars, plaats: null })).toBe("in je regio");
    expect(fillPlaceholders("in {{plaats}}", { ...vars, plaats: "  " })).toBe("in je regio");
  });

  it("laat onbekende placeholders staan zodat typfouten zichtbaar zijn", () => {
    expect(fillPlaceholders("Hoi {{naaam}}", vars)).toBe("Hoi {{naaam}}");
  });
});

describe("unknownPlaceholders", () => {
  it("vindt alleen onbekende namen, ontdubbeld", () => {
    expect(unknownPlaceholders("{{naam}} {{voornaam}} {{ voornaam }} {{site}}")).toEqual(["voornaam"]);
    expect(unknownPlaceholders("geen placeholders")).toEqual([]);
  });
});

describe("skipReason", () => {
  const base = { email: "info@groen.nl", stage: "new", optedOutAt: null, emailsSent: 0 };
  const opts = { onlyNeverEmailed: true };

  it("laat een nieuwe lead door", () => {
    expect(skipReason(base, opts)).toBeNull();
  });

  it("slaat leads zonder e-mail over", () => {
    expect(skipReason({ ...base, email: null }, opts)).toBe("geen_email");
    expect(skipReason({ ...base, email: " " }, opts)).toBe("geen_email");
  });

  it("slaat afgemelde leads en onderdrukte adressen altijd over", () => {
    expect(skipReason({ ...base, optedOutAt: new Date() }, { onlyNeverEmailed: false })).toBe("afgemeld");
    expect(skipReason({ ...base, email: "Info@Groen.nl" }, opts, new Set(["info@groen.nl"]))).toBe("afgemeld");
  });

  it("mailt nooit klanten of verloren leads", () => {
    expect(skipReason({ ...base, stage: "customer" }, opts)).toBe("klant_of_verloren");
    expect(skipReason({ ...base, stage: "lost" }, opts)).toBe("klant_of_verloren");
  });

  it("slaat eerder gemailde leads alleen over als daarom gevraagd is", () => {
    expect(skipReason({ ...base, emailsSent: 1 }, opts)).toBe("al_gemaild");
    expect(skipReason({ ...base, emailsSent: 1 }, { onlyNeverEmailed: false })).toBeNull();
  });
});
