import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local before seeding.");
  }

  // Dynamic imports so DATABASE_URL is set before lib/db reads process.env
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const { users } = await import("../lib/db/schema");
  const { hashPassword } = await import("../lib/auth/password");

  const email = (process.env.SEED_ADMIN_EMAIL ?? "v.munster@weareimpact.nl")
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME ?? "Vincent Munster";

  const passwordHash = await hashPassword(password);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({ passwordHash, role: "admin", name })
      .where(eq(users.id, existing[0].id));
    console.log(`✓ Updated admin user: ${email}`);
  } else {
    await db.insert(users).values({ email, name, passwordHash, role: "admin" });
    console.log(`✓ Created admin user: ${email}`);
  }

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`  Default password: ${password} — change it after first login.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
