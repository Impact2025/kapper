import { config } from "dotenv";
config({ path: ".env.local" });
config();

/**
 * Seeds the "Élixir Atelier" demo salon — a fictional luxury hair salon used
 * to showcase the AI-receptionist embedded on a real salon website
 * (app/demo/elixir-atelier/page.tsx), matching the couture-menu content of
 * that landing page. Safe to re-run: wipes and rebuilds only this one salon
 * (matched by slug), never touches any other salon or user.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local before seeding.");
  }

  const { eq } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const {
    salons,
    users,
    locations,
    treatments,
    staff,
    staffLocations,
    staffTreatments,
    knowledgeEntries,
    appointments,
  } = await import("../lib/db/schema");
  const { hashPassword } = await import("../lib/auth/password");
  const { amsterdamWallTimeToUtc } = await import("../lib/salon/timezone");

  const SLUG = "elixir-atelier";
  const EMAIL = (process.env.DEMO_EMAIL ?? "demo-elixir@kappersassistent.nl").toLowerCase().trim();
  const PASSWORD = process.env.DEMO_PASSWORD || "ElixirDemo2026!";

  // --- Wipe any previous run of this demo (cascades to everything below) ---
  const [existing] = await db.select({ id: salons.id }).from(salons).where(eq(salons.slug, SLUG)).limit(1);
  if (existing) {
    await db.delete(salons).where(eq(salons.id, existing.id));
    console.log(`- Removed previous demo salon (${existing.id})`);
  }

  // --- Salon ---
  const [salon] = await db
    .insert(salons)
    .values({
      name: "Élixir Atelier",
      slug: SLUG,
      plan: "elite",
      status: "active",
      city: "Amsterdam",
      phone: "+31 20 123 4567",
      settings: {
        publicDemo: true,
        noShow: { enabled: true, freeCancelHours: 24, chargePercent: 100 },
      },
    })
    .returning({ id: salons.id });
  const salonId = salon!.id;
  console.log(`✓ Salon aangemaakt: Élixir Atelier (${salonId})`);

  // --- Owner login ---
  const passwordHash = await hashPassword(PASSWORD);
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL)).limit(1);
  if (existingUser) {
    await db.update(users).set({ passwordHash, role: "owner", salonId, name: "Elena Vance" }).where(eq(users.id, existingUser.id));
  } else {
    await db.insert(users).values({ email: EMAIL, name: "Elena Vance", passwordHash, role: "owner", salonId });
  }
  console.log(`✓ Login: ${EMAIL} / ${PASSWORD}`);

  // --- Locations ---
  const locationRows = await db
    .insert(locations)
    .values([
      {
        salonId,
        name: "Élixir Atelier Amsterdam Oud-Zuid",
        city: "Amsterdam",
        address: "Willemsparkweg 84",
        workingHours: { mon: [9, 20], tue: [9, 20], wed: [9, 20], thu: [9, 20], fri: [9, 20], sat: [9, 18], sun: [11, 16] },
      },
      {
        salonId,
        name: "Élixir Atelier Rotterdam Veerhaven",
        city: "Rotterdam",
        address: "Veerhaven 12",
        workingHours: { mon: [9, 20], tue: [9, 20], wed: [9, 20], thu: [9, 20], fri: [9, 20], sat: [9, 18], sun: null },
      },
    ])
    .returning({ id: locations.id, name: locations.name });
  const loc = Object.fromEntries(locationRows.map((l) => [l.name, l.id])) as Record<string, string>;
  console.log(`✓ ${locationRows.length} locaties`);

  // --- Treatments (het Couture Menu) ---
  const treatmentRows = await db
    .insert(treatments)
    .values([
      {
        salonId,
        name: "Bespoke Balayage & Toning",
        category: "Kleur",
        durationMinutes: 120,
        priceCents: 16000,
        description: "Handgemixte balayage met botanische toning, volledig op maat van uw huidondertoon.",
        prepInfo: "Kom bij voorkeur met ongewassen haar (24-48u) voor optimale kleuropname.",
        aftercareInfo: "Gebruik sulfaatvrije shampoo; vermijd wassen de eerste 48 uur na de behandeling.",
      },
      {
        salonId,
        name: "Signature Haircut & Sculpting",
        category: "Knippen",
        durationMinutes: 45,
        priceCents: 6500,
        description: "Precisiesnit met Japans staal, afgestemd op gelaatslijn en levensstijl.",
        prepInfo: "Geen voorbereiding nodig.",
        aftercareInfo: "Thuisverzorgingsadvies wordt na de behandeling meegegeven.",
      },
      {
        salonId,
        name: "Botanical Glossing & Repair Ritual",
        category: "Verzorging",
        durationMinutes: 30,
        priceCents: 4500,
        description: "Botanisch glansritueel met kruidenoliën en hoofdhuidmassage.",
        prepInfo: "Geen voorbereiding nodig.",
        aftercareInfo: "Effect houdt 3-4 weken aan; vermijd hittestyling de eerste 24 uur.",
      },
      {
        salonId,
        name: "Couture Updo & Event Styling",
        category: "Styling",
        durationMinutes: 60,
        priceCents: 8500,
        description: "Op maat gemaakte opsteek- of eventstyling, inclusief sieraad- en bloemwerkopties.",
        prepInfo: "Een proefsessie is mogelijk voorafgaand aan bruiloften of gala's — vraag ernaar.",
        aftercareInfo: "Langdurige fixatie zonder stijve afwerking; touch-upspray wordt meegegeven.",
      },
    ])
    .returning({ id: treatments.id, name: treatments.name });
  const treat = Object.fromEntries(treatmentRows.map((t) => [t.name, t.id])) as Record<string, string>;
  console.log(`✓ ${treatmentRows.length} behandelingen`);

  // --- Staff ---
  const staffRows = await db
    .insert(staff)
    .values([
      { salonId, name: "Elena Vance", role: "Creative Director & Master Colorist" },
      { salonId, name: "Julian de Vries", role: "Senior Hair Sculptor" },
      { salonId, name: "Chloé Laurent", role: "Botanical Ritual Specialist" },
      { salonId, name: "Lucas Moreau", role: "Master Stylist & Texturist" },
    ])
    .returning({ id: staff.id, name: staff.name });
  const st = Object.fromEntries(staffRows.map((s) => [s.name, s.id])) as Record<string, string>;
  console.log(`✓ ${staffRows.length} stylisten`);

  const assignments: { staffName: string; locationNames: string[]; treatmentNames: string[] }[] = [
    { staffName: "Elena Vance", locationNames: ["Élixir Atelier Amsterdam Oud-Zuid"], treatmentNames: ["Bespoke Balayage & Toning", "Couture Updo & Event Styling"] },
    { staffName: "Julian de Vries", locationNames: ["Élixir Atelier Amsterdam Oud-Zuid", "Élixir Atelier Rotterdam Veerhaven"], treatmentNames: ["Signature Haircut & Sculpting", "Couture Updo & Event Styling"] },
    { staffName: "Chloé Laurent", locationNames: ["Élixir Atelier Amsterdam Oud-Zuid"], treatmentNames: ["Botanical Glossing & Repair Ritual", "Signature Haircut & Sculpting"] },
    { staffName: "Lucas Moreau", locationNames: ["Élixir Atelier Rotterdam Veerhaven"], treatmentNames: ["Signature Haircut & Sculpting", "Botanical Glossing & Repair Ritual", "Couture Updo & Event Styling"] },
  ];
  for (const a of assignments) {
    const staffId = st[a.staffName]!;
    await db.insert(staffLocations).values(a.locationNames.map((n) => ({ staffId, locationId: loc[n]! })));
    await db.insert(staffTreatments).values(a.treatmentNames.map((n) => ({ staffId, treatmentId: treat[n]! })));
  }
  console.log(`✓ Bevoegdheden gekoppeld`);

  // --- Knowledge base ---
  await db.insert(knowledgeEntries).values([
    { salonId, title: "Filosofie: Puurheid, Passie & Privacy", category: "Filosofie", content: "Élixir Atelier werkt uitsluitend met 100% botanische, Clean Beauty-gecertificeerde producten — vrij van sulfaten, parabenen en dierproeven. Elke behandeling vindt plaats in een private suite voor volledige rust en discretie." },
    { salonId, title: "Annuleringsbeleid", category: "Beleid", content: "Kosteloos annuleren of verzetten kan tot 24 uur voor de afspraak. Bij later annuleren wordt 50% van het behandeltarief in rekening gebracht." },
    { salonId, title: "Valet Parking & Privé Suites", category: "FAQ", content: "Bij de vestiging Amsterdam Oud-Zuid bieden we valet parking aan. Beide vestigingen beschikken over privé-suites en een botanische lounge met kruidenthee." },
    { salonId, title: "Élixir Privé Membership", category: "FAQ", content: "Leden van Élixir Privé krijgen prioritaire reservaties, 500 welkomstpunten bij inschrijving en een champagne welcome bij elk bezoek. Vraag ernaar tijdens uw afspraak." },
  ]);
  console.log(`✓ Kennisbank gevuld`);

  // --- A few realistic upcoming appointments so the dashboard shows real data ---
  const inDays = (d: number, h: number, m: number) => amsterdamWallTimeToUtc(new Date(), d, h * 60 + m);
  await db.insert(appointments).values([
    { salonId, agendaProvider: "manual", locationId: loc["Élixir Atelier Amsterdam Oud-Zuid"], staffId: st["Elena Vance"], treatmentId: treat["Bespoke Balayage & Toning"], customerName: "Sophie Bergmann", customerPhone: "+31611223344", serviceType: "Bespoke Balayage & Toning", appointmentTime: inDays(1, 11, 0), durationMinutes: 120, source: "ai_whatsapp" },
    { salonId, agendaProvider: "manual", locationId: loc["Élixir Atelier Rotterdam Veerhaven"], staffId: st["Lucas Moreau"], treatmentId: treat["Signature Haircut & Sculpting"], customerName: "Daan Hermans", customerPhone: "+31622334455", serviceType: "Signature Haircut & Sculpting", appointmentTime: inDays(2, 15, 0), durationMinutes: 45, source: "ai_whatsapp" },
    { salonId, agendaProvider: "manual", locationId: loc["Élixir Atelier Amsterdam Oud-Zuid"], staffId: st["Chloé Laurent"], treatmentId: treat["Botanical Glossing & Repair Ritual"], customerName: "Fleur Willems", customerPhone: "+31633445566", serviceType: "Botanical Glossing & Repair Ritual", appointmentTime: inDays(3, 10, 30), durationMinutes: 30, source: "ai_whatsapp" },
  ]);
  console.log(`✓ 3 afspraken`);

  console.log("\n— Demo klaar —");
  console.log(`Kapperswebsite (publiek, met chat-widget): https://kappersassistent.nl/demo/elixir-atelier`);
  console.log(`Salon-dashboard (login):                   https://kappersassistent.nl/login`);
  console.log(`  E-mail:     ${EMAIL}`);
  console.log(`  Wachtwoord: ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed-elixir failed:", err);
    process.exit(1);
  });
