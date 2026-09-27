// Regenerates public/fonts/material-symbols-subset.woff2 (+ lib/icons-manifest.json)
// with only the Material Symbols the source actually uses. Run after adding an
// icon:  node scripts/build-icon-font.mjs
// Google's full variable font is 4 MB; the subset is a few KB.
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "lib"];
const CODEPOINTS =
  "https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints";

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|json)$/.test(f)) yield p;
  }
}

const valid = new Set((await (await fetch(CODEPOINTS)).text()).split("\n").map((l) => l.split(" ")[0]).filter(Boolean));
const used = new Set();
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (file.includes("migrations")) continue;
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/["'`]([a-z][a-z0-9]*(?:_[a-z0-9]+)*)["'`]/g)) {
      if (valid.has(m[1])) used.add(m[1]);
    }
    // Ligatures written as JSX text: <span className="material-symbols-outlined …">north_east</span>
    for (const m of src.matchAll(/material-symbols[^"]*"[^>]*>\s*([a-z0-9_]+)\s*</g)) {
      if (valid.has(m[1])) used.add(m[1]);
    }
  }
}
const names = [...used].sort();

const css = await (
  await fetch(
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0..1,0&icon_names=${names.join(",")}&display=block`,
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } },
  )
).text();
const url = css.match(/url\((https:[^)]+)\)\s*format\('woff2'\)/)?.[1];
if (!url) throw new Error("no woff2 in Google response:\n" + css.slice(0, 300));
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
mkdirSync("public/fonts", { recursive: true });
writeFileSync("public/fonts/material-symbols-subset.woff2", buf);
writeFileSync("lib/icons-manifest.json", JSON.stringify(names, null, 2) + "\n");
console.log(`${names.length} icons, ${buf.length} bytes`);
