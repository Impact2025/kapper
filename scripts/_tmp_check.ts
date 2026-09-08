import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const r: any = await db.execute(sql`select * from drizzle.__drizzle_migrations order by created_at`);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.log("no drizzle schema/table:", (e as Error).message);
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
