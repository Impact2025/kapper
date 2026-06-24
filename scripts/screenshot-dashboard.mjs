import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('C:/Users/v_mun/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const { chromium } = pw;

const BASE = 'http://localhost:2190';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', 'kapper@demo.nl');
  await page.fill('input[name="password"]', 'Demo1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });
  console.log('Ingelogd:', page.url());

  const shots = [
    ['/dashboard', 'ss-dashboard.png'],
    ['/dashboard/ai-receptie', 'ss-ai-receptie.png'],
    ['/dashboard/afspraken', 'ss-afspraken.png'],
    ['/dashboard/no-show', 'ss-no-show.png'],
    ['/dashboard/integraties', 'ss-integraties.png'],
    ['/dashboard/abonnement', 'ss-abonnement.png'],
  ];

  for (const [path, file] of shots) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ ${file}`);
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
