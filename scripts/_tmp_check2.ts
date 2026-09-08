import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const tables: any = await db.execute(sql`select table_name from information_schema.tables where table_schema='public' and table_name in ('products','orders','order_items','inventory_movements') order by table_name`);
  console.log("tables:", tables.rows.map((x: any) => x.table_name));
  const types: any = await db.execute(sql`select typname from pg_type where typname in ('inventory_movement_type','order_status')`);
  console.log("types:", types.rows.map((x: any) => x.typname));
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
