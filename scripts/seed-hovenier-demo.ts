import { config } from "dotenv";
config({ path: ".env.local" });
config();

/**
 * Seeds een complete demo-hovenier ("Groenlust Tuinen") zodat je in
 * HovenierAssistent alle tools met echte data ziet: klus-CRM in elke status,
 * planbord (vandaag/morgen/komende dagen), spoed/stormschade, klanten met
 * meerdere tuinen, tuinpaspoort, seizoenscontracten, offertes (concept t/m
 * geaccepteerd/afgewezen), facturen (open, verlopen, betaald) en AI-gesprekken
 * (telefoon + WhatsApp, incl. doorverbinding).
 *
 * Veilig om opnieuw te draaien: wist en herbouwt alleen deze ene salon (slug),
 * raakt geen andere salon of gebruiker aan.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local before seeding.");
  }

  const { randomBytes } = await import("node:crypto");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const { salons, users, staff, treatments, knowledgeEntries, customers, conversations, messages, agentRuns } =
    await import("../lib/db/schema");
  const {
    customerAddresses,
    assets,
    serviceContracts,
    jobs,
    jobEvents,
    jobDocuments,
    jobDocumentLines,
    salonCounters,
  } = await import("../lib/db/schema-jobs");
  const { hashPassword } = await import("../lib/auth/password");
  const { HOVENIER_VERTICAL } = await import("../lib/verticals/hovenier");
  const { JOB_STATUS_LABEL } = await import("../lib/jobs/model");

  const SLUG = "groenlust-tuinen-demo";
  const EMAIL = (process.env.DEMO_EMAIL ?? "demo@hovenierassistent.nl").toLowerCase().trim();
  const PASSWORD = process.env.DEMO_PASSWORD || "HovenierDemo2026!";

  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;
  const now = Date.now();
  /** Relatief tijdstip: dagen t.o.v. nu, op een vast UTC-uur (≈ 9:00 NL). */
  const at = (days: number, hourUtc = 7, minute = 0) => {
    const d = new Date(now + days * DAY);
    d.setUTCHours(hourUtc, minute, 0, 0);
    return d;
  };
  const ago = (hours: number) => new Date(now - hours * HOUR);
  const token = () => randomBytes(24).toString("base64url");
  const year = new Date().getUTCFullYear();
  const num = (p: "K" | "O" | "F", n: number) => `${p}-${year}-${String(n).padStart(4, "0")}`;

  // --- Wipe vorige run (cascade ruimt alles hieronder op) ---
  const [existing] = await db.select({ id: salons.id }).from(salons).where(eq(salons.slug, SLUG)).limit(1);
  if (existing) {
    await db.delete(salons).where(eq(salons.id, existing.id));
    console.log(`- Vorige demo-salon verwijderd (${existing.id})`);
  }

  // --- Salon ---
  const [salon] = await db
    .insert(salons)
    .values({
      name: "Groenlust Tuinen",
      slug: SLUG,
      vertical: "hovenier",
      plan: "elite",
      status: "active",
      mrr: 64900,
      city: "'s-Hertogenbosch",
      phone: "+31 73 555 0142",
      settings: {
        publicDemo: true,
        business: {
          companyName: "Groenlust Tuinen",
          kvk: "12345678",
          vatNumber: "NL001234567B01",
          iban: "NL91ABNA0417164300",
          street: "Tuinderslaan 7",
          postalCode: "5211 AB",
          city: "'s-Hertogenbosch",
          email: "info@groenlusttuinen.nl",
          phone: "+31 73 555 0142",
          paymentTermDays: 14,
          quoteValidDays: 30,
          quoteIntro: "Bedankt voor je aanvraag. Hieronder vind je onze offerte voor het besproken werk.",
          invoiceFooter: "Wij verzoeken je het bedrag binnen 14 dagen over te maken onder vermelding van het factuurnummer.",
        },
      },
    })
    .returning({ id: salons.id });
  const salonId = salon!.id;
  console.log(`✓ Salon aangemaakt: Groenlust Tuinen (${salonId})`);

  // --- Eigenaar-login ---
  const passwordHash = await hashPassword(PASSWORD);
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL)).limit(1);
  let ownerId: string;
  if (existingUser) {
    ownerId = existingUser.id;
    await db
      .update(users)
      .set({ passwordHash, role: "owner", salonId, name: "Joost van der Berg" })
      .where(eq(users.id, ownerId));
  } else {
    const [u] = await db
      .insert(users)
      .values({ email: EMAIL, name: "Joost van der Berg", passwordHash, role: "owner", salonId })
      .returning({ id: users.id });
    ownerId = u!.id;
  }
  console.log(`✓ Login: ${EMAIL} / ${PASSWORD}`);

  // --- Team ---
  const staffRows = await db
    .insert(staff)
    .values([
      { salonId, name: "Mark de Groot", role: "Ploegleider" },
      { salonId, name: "Sanne Visser", role: "Hovenier" },
      { salonId, name: "Bram Jansen", role: "Boomverzorger" },
    ])
    .returning({ id: staff.id, name: staff.name });
  const st = Object.fromEntries(staffRows.map((s) => [s.name.split(" ")[0]!, s.id])) as Record<string, string>;
  console.log(`✓ ${staffRows.length} teamleden`);

  // --- Diensten (startcatalogus uit het pack) ---
  await db.insert(treatments).values(
    HOVENIER_VERTICAL.serviceTemplates!.map((t) => ({
      salonId,
      name: t.name,
      category: t.category,
      durationMinutes: t.durationMinutes,
      priceCents: t.priceCents,
      vatRatePercent: t.vatRatePercent,
      description: t.description,
    })),
  );
  console.log(`✓ ${HOVENIER_VERTICAL.serviceTemplates!.length} diensten`);

  // --- Klanten + adressen ---
  type CustSeed = {
    key: string;
    name: string;
    phone: string;
    email?: string;
    type: "private" | "business" | "landlord" | "vve";
    companyName?: string;
    notes?: string;
    marketing?: boolean;
    addr: {
      label: string;
      street: string;
      houseNumber: string;
      postalCode: string;
      city: string;
      accessNotes?: string;
      contactName?: string;
      contactPhone?: string;
    };
  };
  const custSeeds: CustSeed[] = [
    { key: "dewit", name: "Familie De Wit", phone: "+31612340001", email: "dewit@example.nl", type: "private", marketing: true,
      addr: { label: "Thuis", street: "Populierenlaan", houseNumber: "14", postalCode: "5211 KL", city: "'s-Hertogenbosch", accessNotes: "Zijpoortje rechts, hond in de tuin (vriendelijk)." } },
    { key: "hoekstra", name: "Mevrouw Hoekstra", phone: "+31612340002", email: "hoekstra@example.nl", type: "private",
      addr: { label: "Thuis", street: "Kastanjelaan", houseNumber: "3", postalCode: "5211 TB", city: "'s-Hertogenbosch", accessNotes: "Tuin alleen bereikbaar via de garage (breedte 2,2 m)." } },
    { key: "vve", name: "Beheerder VvE De Linden", phone: "+31612340003", email: "beheer@delinden-vve.example.nl", type: "vve", companyName: "VvE De Linden",
      addr: { label: "Binnentuin", street: "Lindenplein", houseNumber: "1-24", postalCode: "5038 EA", city: "Tilburg", accessNotes: "Sleutelkluis bij de fietsenstalling, code via beheerder.", contactName: "Peter Ruigrok (beheerder)", contactPhone: "+31612340033" } },
    { key: "bakkerij", name: "Karin van Dijk", phone: "+31612340004", email: "karin@bakkerijvandijk.example.nl", type: "business", companyName: "Bakkerij Van Dijk",
      addr: { label: "Bedrijfspand", street: "Industrieweg", houseNumber: "8", postalCode: "5231 AB", city: "'s-Hertogenbosch", accessNotes: "Leveren vóór 7:00 of na 12:00 (bakkerij bevoorraadt)." } },
    { key: "elamrani", name: "Dhr. El Amrani", phone: "+31612340005", email: "elamrani@example.nl", type: "private", marketing: true,
      addr: { label: "Nieuwbouwwoning", street: "Meidoornstraat", houseNumber: "22", postalCode: "5241 GR", city: "Rosmalen", accessNotes: "Nieuwbouw, tuin nog kaal. Bouwzand ligt nog op de oprit." } },
    { key: "peeters", name: "Vastgoed Peeters", phone: "+31612340006", email: "info@peeters-vastgoed.example.nl", type: "landlord", companyName: "Vastgoed Peeters BV",
      addr: { label: "Verhuurpand Zeestraat", street: "Zeestraat", houseNumber: "5", postalCode: "5211 XM", city: "'s-Hertogenbosch", accessNotes: "Afspraak via huurder.", contactName: "Huurder mevr. Yilmaz", contactPhone: "+31612340066" } },
    { key: "smits", name: "Familie Smits", phone: "+31612340007", type: "private",
      addr: { label: "Thuis", street: "Eikenlaan", houseNumber: "31", postalCode: "5261 AK", city: "Vught" } },
    { key: "vandenberg", name: "Mevrouw Van den Berg", phone: "+31612340008", email: "vandenberg@example.nl", type: "private", marketing: true,
      addr: { label: "Thuis", street: "Beukenhof", houseNumber: "9", postalCode: "5262 BC", city: "Vught", accessNotes: "Vijver achter in de tuin, waterkraan bij de schuur." } },
  ];

  const custRows = await db
    .insert(customers)
    .values(
      custSeeds.map((c) => ({
        salonId,
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        customerType: c.type,
        companyName: c.companyName ?? null,
        notes: c.notes ?? null,
        source: "manual" as const,
        marketingOptIn: c.marketing ?? false,
      })),
    )
    .returning({ id: customers.id, phone: customers.phone });
  const cust: Record<string, string> = {};
  custSeeds.forEach((c) => (cust[c.key] = custRows.find((r) => r.phone === c.phone)!.id));

  const addrRows = await db
    .insert(customerAddresses)
    .values(
      custSeeds.map((c) => ({
        salonId,
        customerId: cust[c.key]!,
        label: c.addr.label,
        street: c.addr.street,
        houseNumber: c.addr.houseNumber,
        postalCode: c.addr.postalCode,
        city: c.addr.city,
        accessNotes: c.addr.accessNotes ?? null,
        contactName: c.addr.contactName ?? null,
        contactPhone: c.addr.contactPhone ?? null,
        isBilling: true,
      })),
    )
    .returning({ id: customerAddresses.id, customerId: customerAddresses.customerId });
  const addr: Record<string, string> = {};
  custSeeds.forEach((c) => (addr[c.key] = addrRows.find((r) => r.customerId === cust[c.key])!.id));
  const addrLine = (key: string) => {
    const a = custSeeds.find((c) => c.key === key)!.addr;
    return `${a.street} ${a.houseNumber}, ${a.city}`;
  };
  console.log(`✓ ${custSeeds.length} klanten met adres`);

  // --- Tuinpaspoort (installaties) ---
  const assetRows = await db
    .insert(assets)
    .values([
      { salonId, customerId: cust.dewit!, addressId: addr.dewit!, kind: "gazon", notes: "Ca. 120 m², schaduw onder de berk, mosgevoelig.", installedAt: at(-900), lastServiceAt: at(-25), nextServiceDue: at(150) },
      { salonId, customerId: cust.dewit!, addressId: addr.dewit!, kind: "haag", brand: "Liguster", notes: "18 m haag achterzijde.", lastServiceAt: at(-170), nextServiceDue: at(9) },
      { salonId, customerId: cust.hoekstra!, addressId: addr.hoekstra!, kind: "boom", brand: "Zomereik", notes: "Circa 16 m hoog, gemeentelijke kapvergunning niet nodig (eigen grond).", lastServiceAt: at(-40), nextServiceDue: at(1050) },
      { salonId, customerId: cust.hoekstra!, addressId: addr.hoekstra!, kind: "beregening", brand: "Gardena", model: "Sprinklersystem 8 zones", installedAt: at(-700), warrantyUntil: at(380), lastServiceAt: at(-330), nextServiceDue: at(35) },
      { salonId, customerId: cust.vve!, addressId: addr.vve!, kind: "tuin", notes: "Binnentuin 640 m², gras, borders en 6 lindes.", nextServiceDue: at(5) },
      { salonId, customerId: cust.bakkerij!, addressId: addr.bakkerij!, kind: "bestrating", notes: "Parkeerplaats klanten, ca. 90 m² klinkers, verzakt bij de ingang.", nextServiceDue: null },
      { salonId, customerId: cust.vandenberg!, addressId: addr.vandenberg!, kind: "vijver", brand: "Folievijver", notes: "6 m³, filter en pomp in de schuur.", lastServiceAt: at(-350), nextServiceDue: at(15) },
      { salonId, customerId: cust.peeters!, addressId: addr.peeters!, kind: "tuin", notes: "Kleine stadstuin, 40 m².", nextServiceDue: null },
    ])
    .returning({ id: assets.id, customerId: assets.customerId, kind: assets.kind });
  const asset = (ck: string, kind: string) => assetRows.find((a) => a.customerId === cust[ck] && a.kind === kind)!.id;
  console.log(`✓ ${assetRows.length} tuinonderdelen (tuinpaspoort)`);

  // --- Seizoenscontracten ---
  const contractRows = await db
    .insert(serviceContracts)
    .values([
      { salonId, customerId: cust.vve!, addressId: addr.vve!, assetId: asset("vve", "tuin"), name: "Seizoensonderhoud binnentuin", jobCategory: "onderhoud", priceCents: 45000, intervalWeeks: 2, seasonStartMonth: 3, seasonEndMonth: 10, startsOn: at(-120), nextDueAt: at(5), leadDays: 7, notes: "Elke twee weken maaien, borders schoffelen, groenafvoer inbegrepen." },
      { salonId, customerId: cust.bakkerij!, addressId: addr.bakkerij!, name: "Entree en borders", jobCategory: "onderhoud", priceCents: 9500, intervalWeeks: 4, seasonStartMonth: 3, seasonEndMonth: 11, startsOn: at(-200), nextDueAt: at(12), leadDays: 7 },
      { salonId, customerId: cust.dewit!, addressId: addr.dewit!, assetId: asset("dewit", "haag"), name: "Haag snoeien, 2× per jaar", jobCategory: "snoeien", priceCents: 15000, intervalMonths: 6, startsOn: at(-360), nextDueAt: at(9), leadDays: 14 },
      { salonId, customerId: cust.vandenberg!, addressId: addr.vandenberg!, assetId: asset("vandenberg", "vijver"), name: "Jaarlijks vijveronderhoud", jobCategory: "onderhoud", priceCents: 17500, intervalMonths: 12, startsOn: at(-350), nextDueAt: at(15), leadDays: 30 },
    ])
    .returning({ id: serviceContracts.id, name: serviceContracts.name });
  const contract = (name: string) => contractRows.find((c) => c.name === name)!.id;
  console.log(`✓ ${contractRows.length} onderhoudscontracten`);

  // --- AI-gesprekken (telefoon + WhatsApp) ---
  const convSeeds = [
    {
      key: "smitsCall", channel: "phone" as const, phone: "+31612340007", name: "Familie Smits", status: "escalated" as const,
      reason: "Tak hangt op stroomkabel — direct doorverbonden met de hovenier van dienst.", startedAt: ago(2),
      lines: [
        ["user", "Ja, hallo, er is net een enorme tak van de eik afgebroken en die hangt half op het kabeltje naar ons huis."],
        ["assistant", "Vervelend, dat klinkt gevaarlijk. Blijf alsjeblieft uit de buurt van de tak en raak hem niet aan. Is er iemand gewond of hangt de tak direct op een stroomkabel?"],
        ["user", "Nee niemand gewond, maar hij ligt wel op de kabel, ik zie het vonken bij de meterkast."],
        ["assistant", "Dank je. Bel voor de veiligheid ook de netbeheerder. Ik leg dit nu vast als spoed en verbind je direct door met de hovenier van dienst. Wat is het adres?"],
        ["user", "Eikenlaan 31 in Vught."],
        ["assistant", "Genoteerd: Eikenlaan 31, Vught. Ik zet je nu door naar Mark de Groot, blijf even aan de lijn."],
      ],
    },
    {
      key: "hoekstraWa", channel: "whatsapp" as const, phone: "+31612340002", name: "Mevrouw Hoekstra", status: "closed" as const,
      reason: null, startedAt: ago(20),
      lines: [
        ["user", "Goedemorgen, na de storm ligt er een grote tak op mijn schuur en er hangt er nog een half af boven het pad. Kunnen jullie komen?"],
        ["assistant", "Vervelend! Blijf uit de buurt van die tak. Kun je een foto sturen en je adres doorgeven? Dan leg ik het direct vast en waarschuw ik de hovenier."],
        ["user", "Kastanjelaan 3 in Den Bosch. Foto volgt. Let op, de tuin is alleen bereikbaar via de garage."],
        ["assistant", "Dank je, ik heb het als spoed vastgelegd inclusief de toegangsinfo. Bram komt vandaag nog langs en stuurt je een bericht als hij onderweg is."],
      ],
    },
    {
      key: "elamraniWa", channel: "whatsapp" as const, phone: "+31612340005", name: "Dhr. El Amrani", status: "active" as const,
      reason: null, startedAt: ago(30),
      lines: [
        ["user", "Hallo, wij hebben een nieuwbouwwoning en de tuin is helemaal kaal, ca. 90 m². We willen graag gazon, een terras en wat borders. Wat kost dat ongeveer?"],
        ["assistant", "Leuk project! Een tuinaanleg van die omvang begint meestal rond €6.000–€9.000, afhankelijk van terras en beplanting. Zal ik een opname inplannen voor een exacte offerte?"],
        ["user", "Ja graag, liefst volgende week."],
        ["assistant", "Ik heb het aangevraagd. Joost neemt contact op om een moment af te spreken."],
      ],
    },
    {
      key: "dewitWa", channel: "whatsapp" as const, phone: "+31612340001", name: "Familie De Wit", status: "closed" as const,
      reason: null, startedAt: ago(96),
      lines: [
        ["user", "Onze haag moet weer gesnoeid worden, wanneer komen jullie?"],
        ["assistant", "Jullie haagcontract staat gepland over ongeveer 9 dagen; Sanne komt dan langs. Zal ik je een bericht sturen als de dag vaststaat?"],
        ["user", "Prima, bedankt!"],
      ],
    },
  ];
  const convRows = await db
    .insert(conversations)
    .values(
      convSeeds.map((c) => ({
        salonId,
        channel: c.channel,
        phoneNumber: c.phone,
        customerName: c.name,
        status: c.status,
        escalationReason: c.reason,
        startedAt: c.startedAt,
        closedAt: c.status === "closed" ? new Date(c.startedAt.getTime() + 20 * 60_000) : null,
        externalId: `demo-${c.key}`,
      })),
    )
    .returning({ id: conversations.id, externalId: conversations.externalId });
  const conv: Record<string, string> = {};
  convSeeds.forEach((c) => (conv[c.key] = convRows.find((r) => r.externalId === `demo-${c.key}`)!.id));

  await db.insert(messages).values(
    convSeeds.flatMap((c) =>
      c.lines.map(([role, content], i) => ({
        conversationId: conv[c.key]!,
        role: role as "user" | "assistant",
        content: content!,
        createdAt: new Date(c.startedAt.getTime() + i * 90_000),
      })),
    ),
  );
  await db.insert(agentRuns).values(
    convSeeds.map((c) => ({
      salonId,
      conversationId: conv[c.key]!,
      channel: c.channel,
      agent: "job-receptionist",
      escalated: c.status === "escalated",
      createdAt: c.startedAt,
    })),
  );
  console.log(`✓ ${convSeeds.length} AI-gesprekken`);

  // --- Klussen ---
  const checklist = (category: string, doneCount: number) => {
    const cat = HOVENIER_VERTICAL.jobCategories!.find((c) => c.key === category)!;
    return cat.checklist.map((label, i) => ({ id: `c${i + 1}`, label, done: i < doneCount }));
  };

  type JobSeed = {
    n: number;
    key: string;
    cust: string;
    title: string;
    description?: string;
    category: string;
    priority?: "urgent" | "high" | "normal" | "low";
    status: string;
    source: "ai_whatsapp" | "ai_phone" | "manual" | "contract" | "web";
    staff?: string;
    scheduled?: Date | null;
    minutes?: number;
    done?: number; // checklist items voltooid
    asset?: string;
    contract?: string;
    conv?: string;
    details?: Record<string, string>;
    started?: Date;
    completed?: Date;
    summary?: string;
    notes?: string;
    signed?: string;
    warranty?: Date;
    cancelled?: string;
    created: Date;
  };
  const jobSeeds: JobSeed[] = [
    { n: 1, key: "smits", cust: "smits", title: "Stormschade: tak op stroomkabel", description: "Grote tak van de eik afgebroken en hangt op de kabel naar de woning. Netbeheerder is gewaarschuwd.", category: "storm", priority: "urgent", status: "new", source: "ai_phone", conv: "smitsCall", details: { boomhoogte: "18", bereikbaarheid: "Met bus/aanhanger tot aan de tuin", groenafvoer: "Wij voeren af" }, created: ago(2) },
    { n: 2, key: "hoekstraStorm", cust: "hoekstra", title: "Stormschade: tak op schuur", description: "Grote tak op de schuur, tweede tak hangt half af boven het pad.", category: "storm", priority: "urgent", status: "en_route", source: "ai_whatsapp", staff: "Bram", scheduled: at(0, 8), minutes: 150, done: 1, conv: "hoekstraWa", details: { boomhoogte: "16", bereikbaarheid: "Alleen via woning of smalle doorgang", groenafvoer: "Wij voeren af" }, created: ago(20) },
    { n: 3, key: "elamrani", cust: "elamrani", title: "Tuinaanleg nieuwbouw (gazon, terras, borders)", description: "Kale tuin ca. 90 m². Gewenst: gazon, terras van 20 m², borders met vaste planten.", category: "aanleg", status: "quoted", source: "ai_whatsapp", conv: "elamraniWa", details: { oppervlak: "90", bereikbaarheid: "Met bus/aanhanger tot aan de tuin", kabelsLeidingen: "Onbekend", buitenkraanStroom: "Alleen water" }, created: ago(30) },
    { n: 4, key: "vveBeurt", cust: "vve", title: "Seizoensonderhoud binnentuin — beurt", category: "onderhoud", status: "in_progress", source: "contract", staff: "Sanne", scheduled: at(0, 7), minutes: 300, done: 3, asset: asset("vve", "tuin"), contract: contract("Seizoensonderhoud binnentuin"), details: { oppervlak: "640", groenafvoer: "Wij voeren af" }, started: ago(2.5), created: ago(24 * 9) },
    { n: 5, key: "dewitHaag", cust: "dewit", title: "Haag snoeien (contract)", category: "snoeien", status: "scheduled", source: "contract", staff: "Sanne", scheduled: at(1, 8), minutes: 180, asset: asset("dewit", "haag"), contract: contract("Haag snoeien, 2× per jaar"), conv: "dewitWa", details: { groenafvoer: "Wij voeren af" }, created: ago(24 * 5) },
    { n: 6, key: "bakkerijParkeer", cust: "bakkerij", title: "Parkeerplaats klanten herstraten", description: "Verzakte klinkers bij de ingang, ca. 30 m² opnieuw leggen.", category: "bestrating", priority: "high", status: "on_hold", source: "manual", staff: "Mark", scheduled: at(4, 6), minutes: 720, asset: asset("bakkerij", "bestrating"), details: { oppervlak: "30", kabelsLeidingen: "Ja" }, notes: "Wachten op levering klinkers (leverancier: donderdag).", created: ago(24 * 12) },
    { n: 7, key: "dewitGazon", cust: "dewit", title: "Gazon verticuteren en doorzaaien", category: "gazon", status: "invoiced", source: "web", staff: "Sanne", scheduled: at(-3, 7), minutes: 240, done: 4, asset: asset("dewit", "gazon"), details: { oppervlak: "120", groenafvoer: "Wij voeren af" }, started: at(-3, 7), completed: at(-3, 11), summary: "Mos verwijderd, gazon verticuteerd en doorgezaaid met schaduwmengsel. Niet betreden en 3 weken dagelijks water geven.", signed: "Familie De Wit", warranty: at(180), created: ago(24 * 10) },
    { n: 8, key: "bakkerijOnderhoud", cust: "bakkerij", title: "Onderhoud entree en borders", category: "onderhoud", status: "paid", source: "contract", staff: "Mark", scheduled: at(-21, 7), minutes: 120, done: 5, contract: contract("Entree en borders"), details: { groenafvoer: "Wij voeren af" }, started: at(-21, 7), completed: at(-21, 9), summary: "Borders schoongemaakt, gras gemaaid en randen afgestoken.", signed: "Karin van Dijk", created: ago(24 * 30) },
    { n: 9, key: "hoekstraBoom", cust: "hoekstra", title: "Eik snoeien en dood hout verwijderen", category: "bomen", status: "invoiced", source: "manual", staff: "Bram", scheduled: at(-40, 7), minutes: 300, done: 6, asset: asset("hoekstra", "boom"), details: { boomhoogte: "16", bereikbaarheid: "Alleen via woning of smalle doorgang", groenafvoer: "Wij voeren af" }, started: at(-40, 7), completed: at(-40, 12), summary: "Dood hout verwijderd en kroon opgeschoond. Hout gestapeld achter in de tuin.", signed: "Mevrouw Hoekstra", created: ago(24 * 50) },
    { n: 10, key: "vandenbergVijver", cust: "vandenberg", title: "Vijver leegmaken en reinigen", category: "onderhoud", status: "cancelled", source: "ai_whatsapp", cancelled: "Klant wil eerst na de vorstperiode inplannen.", asset: asset("vandenberg", "vijver"), created: ago(24 * 20) },
    { n: 11, key: "vandenbergTerras", cust: "vandenberg", title: "Terras en border aanleggen", description: "Nieuw terras 15 m² in gebakken klinkers en aansluitende border.", category: "bestrating", status: "scheduled", source: "manual", staff: "Mark", scheduled: at(9, 6), minutes: 720, details: { oppervlak: "15", kabelsLeidingen: "Nee", bereikbaarheid: "Met bus/aanhanger tot aan de tuin" }, created: ago(24 * 15) },
    { n: 12, key: "peetersOnderhoud", cust: "peeters", title: "Tuin verhuurpand opknappen", description: "Stadstuin van 40 m² kaal maken en gras terugleggen. Afspraak via huurder.", category: "onderhoud", priority: "low", status: "new", source: "web", details: { oppervlak: "40" }, created: ago(6) },
  ];

  const jobRows = await db
    .insert(jobs)
    .values(
      jobSeeds.map((j) => ({
        salonId,
        number: num("K", j.n),
        customerId: cust[j.cust]!,
        addressId: addr[j.cust]!,
        assetId: j.asset ?? null,
        contractId: j.contract ?? null,
        conversationId: j.conv ? conv[j.conv]! : null,
        addressLine: addrLine(j.cust),
        title: j.title,
        description: j.description ?? null,
        category: j.category,
        priority: j.priority ?? "normal",
        status: j.status,
        source: j.source,
        assignedStaffId: j.staff ? st[j.staff]! : null,
        scheduledStart: j.scheduled ?? null,
        estimatedMinutes: j.minutes ?? 120,
        startedAt: j.started ?? null,
        completedAt: j.completed ?? null,
        checklist: checklist(j.category, j.done ?? 0),
        workSummary: j.summary ?? null,
        internalNotes: j.notes ?? null,
        details: j.details ?? {},
        signedByName: j.signed ?? null,
        signedAt: j.signed && j.completed ? j.completed : null,
        warrantyUntil: j.warranty ?? null,
        cancelledReason: j.cancelled ?? null,
        createdAt: j.created,
      })),
    )
    .returning({ id: jobs.id, number: jobs.number });
  const jobId = (n: number) => jobRows.find((r) => r.number === num("K", n))!.id;

  // Tijdlijn per klus
  const sourceMsg: Record<string, string> = {
    ai_phone: "Klus aangemaakt door de AI-receptionist (telefoon)",
    ai_whatsapp: "Klus aangemaakt door de AI-receptionist (WhatsApp)",
    contract: "Klus automatisch aangemaakt vanuit het onderhoudscontract",
    web: "Klus aangevraagd via de website",
    manual: "Klus handmatig aangemaakt",
  };
  const events: (typeof jobEvents.$inferInsert)[] = [];
  for (const j of jobSeeds) {
    events.push({ salonId, jobId: jobId(j.n), kind: "created", message: sourceMsg[j.source]!, createdAt: j.created });
    if (j.priority === "urgent") {
      events.push({ salonId, jobId: jobId(j.n), kind: "ai", message: "Gemarkeerd als spoed; eigenaar per mail en WhatsApp gewaarschuwd", createdAt: new Date(j.created.getTime() + 60_000) });
    }
    if (j.staff && j.scheduled) {
      events.push({ salonId, jobId: jobId(j.n), kind: "scheduled", message: `Ingepland en toegewezen aan ${j.staff}`, createdAt: new Date(j.created.getTime() + 3 * HOUR) });
    }
    if (!["new", "scheduled"].includes(j.status)) {
      events.push({ salonId, jobId: jobId(j.n), kind: "status", message: `Status: ${JOB_STATUS_LABEL[j.status as keyof typeof JOB_STATUS_LABEL] ?? j.status}`, meta: { status: j.status }, createdAt: j.started ?? j.completed ?? new Date(j.created.getTime() + 6 * HOUR) });
    }
  }
  events.push({ salonId, jobId: jobId(6), kind: "note", message: "Klinkers besteld; levering donderdag. Klus staat on hold tot de levering binnen is.", createdAt: ago(24 * 2) });
  await db.insert(jobEvents).values(events);
  console.log(`✓ ${jobRows.length} klussen met tijdlijn`);

  // --- Offertes & facturen ---
  type Line = { kind: "labor" | "material" | "travel" | "other"; description: string; quantity: number; unit: string; unitPriceCents: number; vat?: number };
  type DocSeed = {
    kind: "quote" | "invoice";
    n: number;
    job?: number;
    cust: string;
    status: string;
    title: string;
    issuedAt?: Date;
    validUntil?: Date;
    dueAt?: Date;
    sentAt?: Date;
    acceptedAt?: Date;
    acceptedByName?: string;
    declinedAt?: Date;
    declineReason?: string;
    paidAt?: Date;
    paymentMethod?: string;
    reminderCount?: number;
    lastReminderAt?: Date;
    lines: Line[];
  };

  const docSeeds: DocSeed[] = [
    { kind: "quote", n: 1, job: 3, cust: "elamrani", status: "sent", title: "Offerte tuinaanleg Meidoornstraat 22", issuedAt: ago(20), validUntil: at(25), sentAt: ago(20),
      lines: [
        { kind: "labor", description: "Grondwerk en ondergrond gazon en terras", quantity: 24, unit: "uur", unitPriceCents: 5500 },
        { kind: "material", description: "Terrastegels 60×60 incl. zandbed", quantity: 20, unit: "m²", unitPriceCents: 7500 },
        { kind: "material", description: "Graszoden", quantity: 55, unit: "m²", unitPriceCents: 950 },
        { kind: "material", description: "Vaste planten en grondverbeteraar borders", quantity: 1, unit: "post", unitPriceCents: 68000, vat: 9 },
        { kind: "other", description: "Groenafvoer en overtollige grond", quantity: 4, unit: "aanhanger", unitPriceCents: 4500 },
      ] },
    { kind: "quote", n: 2, job: 11, cust: "vandenberg", status: "accepted", title: "Offerte terras en border Beukenhof 9", issuedAt: ago(24 * 12), validUntil: at(18), sentAt: ago(24 * 12), acceptedAt: ago(24 * 9), acceptedByName: "M. van den Berg",
      lines: [
        { kind: "labor", description: "Uitgraven, fundering en bestrating terras", quantity: 22, unit: "uur", unitPriceCents: 5500 },
        { kind: "material", description: "Gebakken klinkers incl. zand en voegzand", quantity: 15, unit: "m²", unitPriceCents: 6800 },
        { kind: "material", description: "Border: planten en bodembedekker", quantity: 1, unit: "post", unitPriceCents: 32000, vat: 9 },
        { kind: "travel", description: "Voorrijkosten", quantity: 3, unit: "stuk", unitPriceCents: 2500 },
      ] },
    { kind: "quote", n: 3, cust: "hoekstra", status: "declined", title: "Offerte vervangen haag Kastanjelaan 3", issuedAt: ago(24 * 60), validUntil: ago(24 * 30), sentAt: ago(24 * 60), declinedAt: ago(24 * 55), declineReason: "Te duur, we doen het voorlopig zelf.",
      lines: [
        { kind: "labor", description: "Oude haag rooien en nieuwe haag planten", quantity: 12, unit: "uur", unitPriceCents: 5500 },
        { kind: "material", description: "Nieuwe haagplanten (beuk)", quantity: 36, unit: "stuk", unitPriceCents: 1450, vat: 9 },
      ] },
    { kind: "invoice", n: 1, job: 7, cust: "dewit", status: "sent", title: "Factuur gazononderhoud", issuedAt: at(-2), dueAt: at(12), sentAt: at(-2),
      lines: [
        { kind: "other", description: "Gazon verticuteren en doorzaaien", quantity: 1, unit: "post", unitPriceCents: 14500 },
        { kind: "material", description: "Graszaad schaduwmengsel en mest", quantity: 1, unit: "post", unitPriceCents: 4800 },
        { kind: "other", description: "Groenafvoer", quantity: 1, unit: "aanhanger", unitPriceCents: 4500 },
      ] },
    { kind: "invoice", n: 2, job: 8, cust: "bakkerij", status: "paid", title: "Factuur onderhoud entree en borders", issuedAt: at(-20), dueAt: at(-6), sentAt: at(-20), paidAt: at(-8), paymentMethod: "bank",
      lines: [{ kind: "labor", description: "Onderhoud entree en borders (contractbeurt)", quantity: 1, unit: "post", unitPriceCents: 9500 }] },
    { kind: "invoice", n: 3, job: 9, cust: "hoekstra", status: "sent", title: "Factuur snoeiwerk eik", issuedAt: at(-38), dueAt: at(-24), sentAt: at(-38), reminderCount: 1, lastReminderAt: at(-10),
      lines: [
        { kind: "labor", description: "Boomverzorging: snoeien en dood hout verwijderen", quantity: 5, unit: "uur", unitPriceCents: 6500 },
        { kind: "other", description: "Groenafvoer", quantity: 2, unit: "aanhanger", unitPriceCents: 4500 },
        { kind: "travel", description: "Voorrijkosten", quantity: 1, unit: "stuk", unitPriceCents: 2500 },
      ] },
  ];

  const totals = (lines: Line[]) => {
    const byRate = new Map<number, number>();
    for (const l of lines) {
      const net = Math.round(l.quantity * l.unitPriceCents);
      byRate.set(l.vat ?? 21, (byRate.get(l.vat ?? 21) ?? 0) + net);
    }
    const vatBreakdown = [...byRate.entries()].map(([ratePercent, netCents]) => ({
      ratePercent,
      netCents,
      vatCents: Math.round((netCents * ratePercent) / 100),
    }));
    const subtotalCents = vatBreakdown.reduce((s, r) => s + r.netCents, 0);
    const vatCents = vatBreakdown.reduce((s, r) => s + r.vatCents, 0);
    return { vatBreakdown, subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
  };

  const docRows = await db
    .insert(jobDocuments)
    .values(
      docSeeds.map((d) => {
        const c = custSeeds.find((x) => x.key === d.cust)!;
        return {
          salonId,
          jobId: d.job ? jobId(d.job) : null,
          customerId: cust[d.cust]!,
          kind: d.kind,
          number: num(d.kind === "quote" ? "O" : "F", d.n),
          status: d.status,
          publicToken: token(),
          billTo: {
            name: c.name,
            companyName: c.companyName ?? null,
            street: `${c.addr.street} ${c.addr.houseNumber}`,
            postalCode: c.addr.postalCode,
            city: c.addr.city,
            email: c.email ?? null,
            phone: c.phone,
          },
          jobAddress: addrLine(d.cust),
          title: d.title,
          introText: d.kind === "quote" ? "Bedankt voor je aanvraag. Hieronder vind je onze offerte voor het besproken werk." : null,
          footerText: d.kind === "invoice" ? "Wij verzoeken je het bedrag binnen 14 dagen over te maken onder vermelding van het factuurnummer." : null,
          issuedAt: d.issuedAt ?? null,
          validUntil: d.validUntil ?? null,
          dueAt: d.dueAt ?? null,
          sentAt: d.sentAt ?? null,
          acceptedAt: d.acceptedAt ?? null,
          acceptedByName: d.acceptedByName ?? null,
          declinedAt: d.declinedAt ?? null,
          declineReason: d.declineReason ?? null,
          paidAt: d.paidAt ?? null,
          paymentMethod: d.paymentMethod ?? null,
          reminderCount: d.reminderCount ?? 0,
          lastReminderAt: d.lastReminderAt ?? null,
          ...totals(d.lines),
        };
      }),
    )
    .returning({ id: jobDocuments.id, number: jobDocuments.number });

  await db.insert(jobDocumentLines).values(
    docSeeds.flatMap((d) => {
      const documentId = docRows.find((r) => r.number === num(d.kind === "quote" ? "O" : "F", d.n))!.id;
      return d.lines.map((l, i) => ({
        documentId,
        salonId,
        position: i,
        kind: l.kind,
        description: l.description,
        quantity: String(l.quantity),
        unit: l.unit,
        unitPriceCents: l.unitPriceCents,
        vatRatePercent: l.vat ?? 21,
      }));
    }),
  );

  // Nummerteller doorzetten zodat de eerstvolgende klus/offerte/factuur netjes verder telt.
  await db.insert(salonCounters).values([
    { salonId, key: "job", year, value: jobSeeds.length },
    { salonId, key: "quote", year, value: docSeeds.filter((d) => d.kind === "quote").length },
    { salonId, key: "invoice", year, value: docSeeds.filter((d) => d.kind === "invoice").length },
  ]);
  console.log(`✓ ${docSeeds.length} offertes/facturen`);

  // --- Kennisbank voor de AI-receptionist ---
  await db.insert(knowledgeEntries).values([
    { salonId, title: "Werkgebied", category: "Algemeen", content: "Wij werken in 's-Hertogenbosch, Vught, Rosmalen, Tilburg en omgeving (tot ca. 25 km)." },
    { salonId, title: "Openingstijden en bereikbaarheid", category: "Algemeen", content: "Werkdagen 7:30–17:00. Stormschade en acute gevaarlijke situaties nemen we ook buiten kantoortijd aan." },
    { salonId, title: "Tarieven", category: "Prijzen", content: "Uurtarief hovenier €55 excl. btw, spoedtarief storm €85 per uur, voorrijkosten €25. Tuinaanleg altijd op basis van een offerte na opname." },
    { salonId, title: "Kap- en snoeivergunning", category: "Vakkennis", content: "Grote bomen kappen kan vergunningplichtig zijn. Wij adviseren de klant altijd om de regels van de gemeente te checken; wij doen zelf geen toezeggingen over vergunningen." },
  ]);
  console.log("✓ Kennisbank");

  console.log("\nKlaar. Inloggen op /login met:");
  console.log(`  E-mail: ${EMAIL}`);
  console.log(`  Wachtwoord: ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
