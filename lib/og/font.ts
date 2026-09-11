import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Google Fonts serves plain TrueType only to user agents old enough to predate
// WOFF/WOFF2/EOT — satori (next/og's renderer) needs TTF/OTF, so we spoof one.
const LEGACY_UA =
  "Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";

async function loadGoogleFont(family: string, weight: number, text: string) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl, { headers: { "User-Agent": LEGACY_UA } }).then((res) => res.text());
  const match = css.match(/src: url\(([^)]+)\) format\('truetype'\)/);
  if (!match) throw new Error(`Could not find truetype font source for ${family}`);
  return fetch(match[1]).then((res) => res.arrayBuffer());
}

// Every static (non-title) string rendered in the Hanken Grotesk weight across
// all card variants — must stay in sync with lib/og/card.tsx, since Google
// Fonts only subsets the exact characters requested here.
const HANKEN_STATIC_TEXT =
  "KapperAssistent.nl AI-RECEPTIE VOOR KAPSALONS BLOG · Focus op je vak, niet op de telefoon";

/** Loads only the glyphs actually used in the OG card, subset to keep fetches small. */
export async function loadOgFonts(title: string) {
  const [garamond, hanken] = await Promise.all([
    loadGoogleFont("EB+Garamond", 600, title),
    loadGoogleFont("Hanken+Grotesk", 700, HANKEN_STATIC_TEXT),
  ]);
  return [
    { name: "EB Garamond", data: garamond, weight: 600 as const, style: "normal" as const },
    { name: "Hanken Grotesk", data: hanken, weight: 700 as const, style: "normal" as const },
  ];
}

let logoDataUrlCache: string | null = null;

export async function loadLogoDataUrl() {
  if (logoDataUrlCache) return logoDataUrlCache;
  const buf = await readFile(join(process.cwd(), "public/logo.png"));
  logoDataUrlCache = `data:image/png;base64,${buf.toString("base64")}`;
  return logoDataUrlCache;
}
