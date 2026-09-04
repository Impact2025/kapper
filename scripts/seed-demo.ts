import { config } from "dotenv";
config({ path: ".env.local" });
config();

/**
 * Seeds a self-contained demo salon so a prospect (and the sales team) can
 * see the multi-location AI-receptionist live — real dashboard, real data,
 * not a mock. Modeled on the Huidzorg Clinics inquiry (huidtherapie,
 * meerdere vestigingen). Safe to re-run: wipes and rebuilds only this one
 * salon (matched by slug), never touches any other salon or user.
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

  const SLUG = "huidzorg-clinics-demo";
  const EMAIL = (process.env.DEMO_EMAIL ?? "demo@kappersassistent.nl").toLowerCase().trim();
  const PASSWORD = process.env.DEMO_PASSWORD || "HuidzorgDemo2026!";

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
      name: "Huidzorg Clinics",
      slug: SLUG,
      plan: "pro",
      status: "active",
      city: "'s-Hertogenbosch",
      phone: "+31 73 123 4567",
      settings: {
        noShow: { enabled: true, freeCancelHours: 24, chargePercent: 100 },
      },
    })
    .returning({ id: salons.id });
  const salonId = salon!.id;
  console.log(`✓ Salon aangemaakt: Huidzorg Clinics (${salonId})`);

  // --- Owner login ---
  const passwordHash = await hashPassword(PASSWORD);
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL)).limit(1);
  if (existingUser) {
    await db.update(users).set({ passwordHash, role: "owner", salonId, name: "Pauline van Wamel" }).where(eq(users.id, existingUser.id));
  } else {
    await db.insert(users).values({ email: EMAIL, name: "Pauline van Wamel", passwordHash, role: "owner", salonId });
  }
  console.log(`✓ Login: ${EMAIL} / ${PASSWORD}`);

  // --- Locations ---
  const locationRows = await db
    .insert(locations)
    .values([
      { salonId, name: "Huidzorg Clinics Den Bosch", city: "'s-Hertogenbosch", address: "Hinthamerstraat 12", workingHours: { mon: [9, 17], tue: [9, 17], wed: [9, 17], thu: [9, 17], fri: [9, 17], sat: [9, 13], sun: null } },
      { salonId, name: "Huidzorg Clinics Eindhoven", city: "Eindhoven", address: "Kanaalstraat 45", workingHours: { mon: [9, 17], tue: [9, 17], wed: [9, 17], thu: [9, 17], fri: [9, 17], sat: null, sun: null } },
      { salonId, name: "Huidzorg Clinics Tilburg", city: "Tilburg", address: "Heuvelring 8", workingHours: { mon: [9, 17], tue: [9, 17], wed: [9, 17], thu: [9, 17], fri: [9, 17], sat: [9, 13], sun: null } },
    ])
    .returning({ id: locations.id, name: locations.name });
  const loc = Object.fromEntries(locationRows.map((l) => [l.name, l.id])) as Record<string, string>;
  console.log(`✓ ${locationRows.length} locaties`);

  // --- Treatments ---
  const treatmentRows = await db
    .insert(treatments)
    .values([
      { salonId, name: "Intake & huidanalyse", category: "Diagnose", durationMinutes: 45, priceCents: 6500, description: "Uitgebreide analyse van de huid met scan en persoonlijk behandelplan.", prepInfo: "Kom bij voorkeur ongesminkt; vermijd zon 48 uur vooraf.", aftercareInfo: "Geen bijzonderheden." },
      { salonId, name: "Chemisch peeling (medium-depth)", category: "Peeling", durationMinutes: 30, priceCents: 12000, description: "Verbetert pigmentvlekken, fijne lijntjes en acnelittekens.", prepInfo: "Stop met retinol en scrubs 5 dagen vooraf; geen zon of zonnebank 2 weken vooraf.", aftercareInfo: "Huid kan 3-5 dagen vervellen. SPF50 verplicht, geen make-up de eerste 24 uur." },
      { salonId, name: "Microneedling", category: "Collageeninductie", durationMinutes: 60, priceCents: 14000, description: "Stimuleert collageenaanmaak voor een egalere, steviger huid.", prepInfo: "Overleg bloedverdunners vooraf met je huidtherapeut.", aftercareInfo: "Huid rood gedurende 24-48 uur; geen make-up of intensief sporten die dag." },
      { salonId, name: "Laserontharing (per zone)", category: "Ontharing", durationMinutes: 30, priceCents: 7000, description: "Permanente haarreductie met diodelaser, geschikt voor de meeste huidtypen.", prepInfo: "Scheren i.p.v. harsen/epileren 24 uur vooraf; geen zon 2 weken vooraf.", aftercareInfo: "Lichte roodheid mogelijk; SPF verplicht op de behandelde zone." },
      { salonId, name: "Acnebehandeling (medisch)", category: "Acne", durationMinutes: 45, priceCents: 8500, description: "Combinatie van extracties, LED-lichttherapie en peeling op maat.", prepInfo: "Neem je huidige acneproducten mee naar de afspraak.", aftercareInfo: "Volg het nazorgschema van je huidtherapeut nauwkeurig op." },
      { salonId, name: "Camouflagetherapie", category: "Camouflage", durationMinutes: 60, priceCents: 9500, description: "Medische camouflage voor littekens, vitiligo of couperose.", prepInfo: "Geen voorbereiding nodig.", aftercareInfo: "Je krijgt instructies mee voor het aanbrengen thuis." },
      { salonId, name: "Littekentherapie", category: "Littekens", durationMinutes: 45, priceCents: 11000, description: "Behandeling met microneedling en siliconen voor operatie- of ongevallittekens.", prepInfo: "Het litteken moet volledig gesloten zijn (minimaal 6 weken oud).", aftercareInfo: "Dagelijkse massage-instructies; SPF verplicht op het litteken." },
      { salonId, name: "IPL fotorejuvenatie", category: "Lichttherapie", durationMinutes: 30, priceCents: 13000, description: "Vermindert pigmentvlekken en rode vaatjes, verbetert de huidtextuur.", prepInfo: "Geen zon of zelfbruiner gebruiken in de 4 weken vooraf.", aftercareInfo: "Pigment kan tijdelijk donkerder worden en schilferen; SPF50 verplicht." },
    ])
    .returning({ id: treatments.id, name: treatments.name });
  const treat = Object.fromEntries(treatmentRows.map((t) => [t.name, t.id])) as Record<string, string>;
  console.log(`✓ ${treatmentRows.length} behandelingen`);

  // --- Staff ---
  const staffRows = await db
    .insert(staff)
    .values([
      { salonId, name: "Sanne de Groot", role: "Huidtherapeut" },
      { salonId, name: "Mila van Dijk", role: "Huidtherapeut" },
      { salonId, name: "Femke Jansen", role: "Huidtherapeut i.o." },
      { salonId, name: "Rosa Bakker", role: "Senior huidtherapeut" },
      { salonId, name: "Daan Visser", role: "Huidtherapeut" },
    ])
    .returning({ id: staff.id, name: staff.name });
  const st = Object.fromEntries(staffRows.map((s) => [s.name, s.id])) as Record<string, string>;
  console.log(`✓ ${staffRows.length} behandelaars`);

  const assignments: { staffName: string; locationNames: string[]; treatmentNames: string[] }[] = [
    { staffName: "Sanne de Groot", locationNames: ["Huidzorg Clinics Den Bosch", "Huidzorg Clinics Tilburg"], treatmentNames: ["Intake & huidanalyse", "Chemisch peeling (medium-depth)", "Microneedling", "Acnebehandeling (medisch)", "Littekentherapie"] },
    { staffName: "Mila van Dijk", locationNames: ["Huidzorg Clinics Den Bosch"], treatmentNames: ["Intake & huidanalyse", "Laserontharing (per zone)", "IPL fotorejuvenatie", "Camouflagetherapie"] },
    { staffName: "Femke Jansen", locationNames: ["Huidzorg Clinics Eindhoven"], treatmentNames: ["Intake & huidanalyse", "Chemisch peeling (medium-depth)", "Laserontharing (per zone)"] },
    { staffName: "Rosa Bakker", locationNames: ["Huidzorg Clinics Eindhoven", "Huidzorg Clinics Tilburg"], treatmentNames: ["Intake & huidanalyse", "Microneedling", "Littekentherapie", "Acnebehandeling (medisch)", "IPL fotorejuvenatie"] },
    { staffName: "Daan Visser", locationNames: ["Huidzorg Clinics Tilburg"], treatmentNames: ["Intake & huidanalyse", "Laserontharing (per zone)", "Camouflagetherapie"] },
  ];
  for (const a of assignments) {
    const staffId = st[a.staffName]!;
    await db.insert(staffLocations).values(a.locationNames.map((n) => ({ staffId, locationId: loc[n]! })));
    await db.insert(staffTreatments).values(a.treatmentNames.map((n) => ({ staffId, treatmentId: treat[n]! })));
  }
  console.log(`✓ Bevoegdheden gekoppeld`);

  // --- Knowledge base ---
  await db.insert(knowledgeEntries).values([
    { salonId, title: "Acnebeleid", category: "Protocol", content: "Bij matige tot ernstige acne starten we altijd met een intake om medicatiegebruik en huidtype te bepalen. Actieve ontstoken acne wordt nooit direct chemisch gepeeld — eerst minimaal 2 acnebehandelingen ter kalmering." },
    { salonId, title: "Zwangerschap en behandelingen", category: "FAQ", content: "Tijdens zwangerschap en borstvoeding zijn chemische peelings, laserontharing en IPL niet toegestaan. Camouflagetherapie en een lichte huidanalyse kunnen wel." },
    { salonId, title: "Annuleringsbeleid", category: "Beleid", content: "Kosteloos annuleren of verzetten kan tot 24 uur voor de afspraak. Bij te laat annuleren wordt 50% van het behandeltarief in rekening gebracht." },
    { salonId, title: "Parkeren bij de vestigingen", category: "FAQ", content: "Den Bosch: parkeergarage Hinthamerstraat, eerste uur gratis met onze parkeerkaart. Eindhoven: gratis straatparkeren na 18:00. Tilburg: parkeergarage Heuvelring, 5 minuten lopen." },
  ]);
  console.log(`✓ Kennisbank gevuld`);

  // --- A few realistic upcoming appointments so /dashboard/afspraken shows real data ---
  const inDays = (d: number, h: number, m: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, m, 0, 0);
    return dt;
  };
  await db.insert(appointments).values([
    { salonId, agendaProvider: "manual", locationId: loc["Huidzorg Clinics Den Bosch"], staffId: st["Sanne de Groot"], treatmentId: treat["Chemisch peeling (medium-depth)"], customerName: "Marieke de Wit", customerPhone: "+31612345678", serviceType: "Chemisch peeling (medium-depth)", appointmentTime: inDays(1, 10, 0), durationMinutes: 30, source: "ai_whatsapp" },
    { salonId, agendaProvider: "manual", locationId: loc["Huidzorg Clinics Eindhoven"], staffId: st["Rosa Bakker"], treatmentId: treat["Laserontharing (per zone)"], customerName: "Youssef El Amrani", customerPhone: "+31687654321", serviceType: "Laserontharing (per zone)", appointmentTime: inDays(2, 14, 30), durationMinutes: 30, source: "ai_phone" },
    { salonId, agendaProvider: "manual", locationId: loc["Huidzorg Clinics Den Bosch"], staffId: st["Mila van Dijk"], treatmentId: treat["Intake & huidanalyse"], customerName: "Lotte Verhoeven", customerPhone: "+31698765432", serviceType: "Intake & huidanalyse", appointmentTime: inDays(3, 9, 0), durationMinutes: 45, source: "ai_whatsapp" },
    { salonId, agendaProvider: "manual", locationId: loc["Huidzorg Clinics Tilburg"], staffId: st["Daan Visser"], treatmentId: treat["Camouflagetherapie"], customerName: "Bram Kuipers", customerPhone: "+31611223344", serviceType: "Camouflagetherapie", appointmentTime: inDays(5, 11, 0), durationMinutes: 60, source: "manual" },
  ]);
  console.log(`✓ 4 afspraken`);

  console.log("\n— Demo klaar —");
  console.log(`URL:      https://kappersassistent.nl/login`);
  console.log(`E-mail:   ${EMAIL}`);
  console.log(`Wachtwoord: ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed-demo failed:", err);
    process.exit(1);
  });
