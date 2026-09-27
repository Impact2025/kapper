import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface SourceLead {
  salonName: string;
  email: string;
  phone: string | null;
  url: string | null;
  street: string | null;
  postcode: string | null;
  city: string | null;
  province: string | null;
  openingstijden: string | null;
  googleScore: number | null;
  googleReviews: number | null;
  chainLocations: Array<{
    name: string;
    street: string | null;
    postcode: string | null;
    city: string | null;
    phone: string | null;
    openingstijden: string | null;
    googleScore: number | null;
    googleReviews: number | null;
  }> | null;
  vertical: string;
}

/**
 * Generic bulk-lead import: reads a JSON export (see
 * scripts/data/leads-randstad-email-2026-09.json for the shape) and upserts
 * into the `leads` table, keyed on email so re-runs are safe. `vertical`
 * comes from each record — different outreach batches (kapper, hovenier, …)
 * can live in the same file or separate files, tagged accordingly.
 *
 * Usage: tsx scripts/import-leads.ts --file scripts/data/<file>.json [--source <tag>] [--commit]
 */
async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const fileArg = argValue(args, "--file");
  const sourceArg = argValue(args, "--source");

  if (!fileArg) {
    throw new Error("Geef --file <pad naar json> mee.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local before importing.");
  }

  const dataFile = resolve(process.cwd(), fileArg);
  const raw = readFileSync(dataFile, "utf-8");
  const sourceLeads: SourceLead[] = JSON.parse(raw);

  const { eq } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const { leads } = await import("../lib/db/schema");
  const { isVerticalId } = await import("../lib/verticals");

  let toInsert = 0;
  let toSkip = 0;

  for (const lead of sourceLeads) {
    if (!isVerticalId(lead.vertical)) {
      throw new Error(
        `Onbekende vertical "${lead.vertical}" bij ${lead.salonName} <${lead.email}> — voeg 'm toe aan lib/verticals of fix de data.`,
      );
    }

    const existing = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.email, lead.email))
      .limit(1);

    if (existing[0]) {
      toSkip++;
      console.log(`- skip (bestaat al): ${lead.salonName} <${lead.email}>`);
      continue;
    }

    toInsert++;
    const scanResult = {
      source: sourceArg ?? dataFile,
      street: lead.street,
      postcode: lead.postcode,
      province: lead.province,
      openingstijden: lead.openingstijden,
      googleScore: lead.googleScore,
      googleReviews: lead.googleReviews,
      chainLocations: lead.chainLocations,
    };

    if (commit) {
      await db.insert(leads).values({
        salonName: lead.salonName,
        email: lead.email,
        phone: lead.phone,
        url: lead.url,
        city: lead.city,
        vertical: lead.vertical,
        stage: "new",
        scanResult,
      });
      console.log(`✓ toegevoegd [${lead.vertical}]: ${lead.salonName} <${lead.email}>`);
    } else {
      console.log(`+ zou toevoegen [${lead.vertical}]: ${lead.salonName} <${lead.email}> (${lead.city})`);
    }
  }

  console.log("");
  console.log(`Totaal in bestand: ${sourceLeads.length}`);
  console.log(`${commit ? "Toegevoegd" : "Zou toevoegen"}: ${toInsert}`);
  console.log(`Overgeslagen (bestaand e-mailadres): ${toSkip}`);
  if (!commit) {
    console.log("");
    console.log("Dit was een dry-run — geen wijzigingen in de database.");
    console.log("Run met --commit om daadwerkelijk te importeren.");
  }
}

function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
