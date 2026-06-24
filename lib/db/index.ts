import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Drizzle client backed by Neon's serverless HTTP driver.
 * `db` is lazily usable; throws a clear error if DATABASE_URL is missing.
 */
function createDb() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local",
    );
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = connectionString ? createDb() : (undefined as never);
export { schema };
