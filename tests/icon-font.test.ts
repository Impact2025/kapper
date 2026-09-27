import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import manifest from "@/lib/icons-manifest.json";

function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(f)) yield p;
  }
}

/**
 * The icon font is a subset (scripts/build-icon-font.mjs). An icon used in the
 * source but missing from it would render as its raw ligature name ("event_available").
 */
describe("self-hosted icon font", () => {
  it("contains every icon referenced as a literal", () => {
    const have = new Set(manifest);
    const missing = new Set<string>();
    for (const root of ["app", "components", "lib"]) {
      for (const file of walk(root)) {
        const src = readFileSync(file, "utf8");
        for (const m of src.matchAll(/<Icon\s[^>]*?name="([a-z0-9_]+)"|\bicon:\s*"([a-z0-9_]+)"|\blogoIcon:\s*"([a-z0-9_]+)"|material-symbols[^"]*"[^>]*>\s*([a-z0-9_]+)\s*</g)) {
          const name = m[1] ?? m[2] ?? m[3] ?? m[4];
          if (!have.has(name)) missing.add(`${name} (${file})`);
        }
      }
    }
    expect([...missing], "run: node scripts/build-icon-font.mjs").toEqual([]);
  }, 30_000);
});
