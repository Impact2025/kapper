import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildJobSystemPrompt, buildJobTools, agentPromptFor } from "@/lib/ai/job-receptionist";
import { HOVENIER_VERTICAL, LOODGIETER_VERTICAL, SCHILDER_VERTICAL, listVerticals } from "@/lib/verticals";
import type { SalonContext } from "@/lib/ai/receptionist";

const salon = {
  id: "s1",
  name: "Testbedrijf",
  city: "Utrecht",
  noShowSettings: { enabled: false },
} as unknown as SalonContext;

const opts = { knowledgeText: "", servicesBlock: "DIENSTEN: []", staffJson: "[]", locationsJson: "[]" };
const promptFor = (pack: typeof LOODGIETER_VERTICAL) => buildJobSystemPrompt(salon, pack, opts);

const JOB_PACKS = listVerticals().filter((v) => v.archetype === "job");

describe("job receptionist — vak rules live in the pack", () => {
  it("keeps the plumber's gas and water safety rules exactly", () => {
    const p = promptFor(LOODGIETER_VERTICAL);
    expect(p).toContain("gaslucht, geen warm water of verwarming bij kou, veiligheidsrisico) behandel je als spoed");
    expect(p).toContain("het gasstoringsnummer 0800-9009 bellen; bij acuut gevaar 112. Leg daarna direct de klus vast");
    expect(p).toContain("die onderweg of onder een gootsteen ligt");
    expect(p).toContain("(bijv. een nieuwe ketel of badkamer)");
    expect(p).toContain("(bijv. gaslek, ernstige waterschade), klachten");
    expect(p).toContain("(bijv. een lekkage, leiding of cv-ketel), gebruik die om in te schatten welke klus");
  });

  it("does not leak plumber hazards into a vak that declares no rules of its own", () => {
    const p = promptFor(SCHILDER_VERTICAL);
    expect(p).not.toMatch(/gas|hoofdkraan|gootsteen|ketel|lekkage|0800-9009/i);
    expect(p).toContain("SPOED:");
    expect(p).toContain("escalate_to_staff");
  });

  it("gives the hovenier storm and tree rules instead of gas and water", () => {
    const p = promptFor(HOVENIER_VERTICAL);
    expect(p).toContain("stroomkabel");
    expect(p).toContain("omgevallen boom");
    expect(p).not.toMatch(/gaslucht|hoofdkraan|gootsteen|ketel|0800-9009/i);
  });

  it("uses the pack's own spoed hint in the register_job tool schema", () => {
    const hint = (pack: typeof LOODGIETER_VERTICAL) => {
      const tools = buildJobTools(pack, []);
      const rj = tools.find((t) => t.name === "register_job")!;
      return (rj.input_schema as { properties: { urgency: { description: string } } }).properties.urgency.description;
    };
    expect(hint(LOODGIETER_VERTICAL)).toContain("water/gas");
    expect(hint(SCHILDER_VERTICAL)).not.toMatch(/gas|water/i);
  });

  it("every job pack resolves a complete rule set with a {treatment} photo rule", () => {
    for (const pack of JOB_PACKS) {
      const ap = agentPromptFor(pack);
      for (const v of Object.values(ap)) expect(v.length).toBeGreaterThan(0);
      expect(promptFor(pack)).not.toContain("{treatment}");
    }
  });
});
