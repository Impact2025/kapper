/**
 * Maakt schermafbeeldingen van de hovenier-demo (mobiel én desktop) voor de
 * handleiding en om de mobiele weergave na te lopen.
 *
 *   node scripts/screenshot-hovenier.mjs [basisurl] [uitvoermap]
 *
 * Vereist dat de dev-server draait en `npm run db:seed-hovenier` is uitgevoerd.
 * Playwright komt uit de npx-cache (net als scripts/screenshot-dashboard.mjs).
 */
import { createRequire } from "module";
import { mkdirSync, writeFileSync } from "fs";
const require = createRequire(import.meta.url);
const { chromium, devices } = require("C:/Users/v_mun/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");

const BASE = process.argv[2] ?? "http://localhost:8077";
const OUT = process.argv[3] ?? "docs/handleiding-hovenier/screenshots";
const EMAIL = process.env.DEMO_EMAIL ?? "demo@hovenierassistent.nl";
const PASSWORD = process.env.DEMO_PASSWORD ?? "HovenierDemo2026!";

const VIEWS = {
  mobiel: { ...devices["iPhone 15 Pro"], viewport: { width: 393, height: 852 } },
  desktop: { viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 },
};

// [bestandsnaam, pad] — dynamische pagina's (klus, klant, factuur) worden hieronder opgezocht.
const PAGES = [
  ["01-startpagina", "/dashboard"],
  ["02-klussen", "/dashboard/klussen"],
  ["03-nieuwe-klus", "/dashboard/klussen/nieuw"],
  ["05-planbord", "/dashboard/planbord"],
  ["06-klanten", "/dashboard/klanten"],
  ["08-offertes-facturen", "/dashboard/facturatie"],
  ["10-onderhoud", "/dashboard/onderhoud"],
  ["11-ai-receptie", "/dashboard/ai-receptie"],
  ["12-gesprekken", "/dashboard/gesprekken"],
  ["13-storm-doorverbinden", "/dashboard/escalaties"],
  ["14-diensten-team", "/dashboard/praktijk"],
  ["15-rapportage", "/dashboard/rapportage"],
  ["16-reviews-terugkeer", "/dashboard/retentie"],
  ["17-annulering", "/dashboard/no-show"],
  ["18-integraties", "/dashboard/integraties"],
  ["19-abonnement", "/dashboard/abonnement"],
  ["20-bedrijfsgegevens", "/dashboard/facturatie/instellingen"],
];

async function shoot(page, dir, name, fullPage = true) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  return overflow;
}

async function firstHref(page, selector) {
  return page.evaluate((sel) => document.querySelector(sel)?.getAttribute("href") ?? null, selector);
}

// Optioneel: ONLY="04b-werkbon,01-startpagina" en VIEW="mobiel" beperken de run.
const ONLY = process.env.ONLY?.split(",").map((x) => x.trim());
const VIEW = process.env.VIEW;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const [viewName, opts] of Object.entries(VIEWS)) {
    if (VIEW && VIEW !== viewName) continue;
    const dir = `${OUT}/${viewName}`;
    mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ ...opts, locale: "nl-NL", timezoneId: "Europe/Amsterdam" });
    const page = await ctx.newPage();
    page.setDefaultTimeout(120000);

    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 120000 }), page.click('button[type="submit"]')]);

    const list = [...PAGES];

    // Dynamische pagina's: eerste klus, klant, offerte en factuur.
    await page.goto(`${BASE}/dashboard/klussen`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const jobHref = await firstHref(page, 'a[href^="/dashboard/klussen/"]:not([href$="/nieuw"])');
    if (jobHref) list.push(["04-klus-detail", jobHref], ["04b-werkbon", `${jobHref}/werkbon`]);

    await page.goto(`${BASE}/dashboard/klanten`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const custHref = await firstHref(page, 'a[href^="/dashboard/klanten/"]');
    if (custHref) list.push(["07-klant-detail", custHref]);

    await page.goto(`${BASE}/dashboard/facturatie`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const docHref = await firstHref(page, 'a[href^="/dashboard/facturatie/"]:not([href$="/instellingen"])');
    if (docHref) list.push(["09-offerte-factuur-detail", docHref]);

    for (const [name, path] of list) {
      if (ONLY && !ONLY.includes(name)) continue;
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
        const overflow = await shoot(page, dir, name);
        report.push({ view: viewName, name, path, horizontalOverflowPx: overflow });
        console.log(`✓ ${viewName} ${name}${overflow > 0 ? `  ⚠ horizontale scroll +${overflow}px` : ""}`);
      } catch (e) {
        report.push({ view: viewName, name, path, error: String(e).slice(0, 200) });
        console.log(`✗ ${viewName} ${name}: ${String(e).slice(0, 120)}`);
      }
    }

    // Publieke pagina's
    const pub = await browser.newContext({ ...opts, locale: "nl-NL" });
    const pp = await pub.newPage();
    pp.setDefaultTimeout(120000);
    for (const [name, path] of [
      ["p1-landing", "/sites/hovenier"],
      ["p2-prijzen", "/sites/hovenier/prijzen"],
      ["p3-contact", "/sites/hovenier/contact"],
    ]) {
      if (ONLY && !ONLY.includes(name)) continue;
      try {
        await pp.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
        const overflow = await shoot(pp, dir, name);
        report.push({ view: viewName, name, path, horizontalOverflowPx: overflow });
        console.log(`✓ ${viewName} ${name}${overflow > 0 ? `  ⚠ horizontale scroll +${overflow}px` : ""}`);
      } catch (e) {
        console.log(`✗ ${viewName} ${name}: ${String(e).slice(0, 120)}`);
      }
    }
    await pub.close();
    await ctx.close();
  }

  if (!ONLY && !VIEW) writeFileSync(`${OUT}/rapport.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
