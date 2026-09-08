import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import fs from "node:fs";

async function main() {
  const file = "lib/db/migrations/0007_sloppy_lilith.sql";
  const content = fs.readFileSync(file, "utf8");
  const statements = content.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    console.log("Running:", stmt.slice(0, 80).replace(/\n/g, " "), "...");
    try {
      await db.execute(sql.raw(stmt));
    } catch (e: any) {
      const code = e?.cause?.code ?? e?.code;
      if (code === "42710" || code === "42P07") {
        console.log("  -> already exists, skipping");
        continue;
      }
      throw e;
    }
  }
  console.log("Done —", statements.length, "statements processed.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
