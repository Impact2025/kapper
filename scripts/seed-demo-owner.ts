import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../lib/db");
  const { users, salons } = await import("../lib/db/schema");
  const { hashPassword } = await import("../lib/auth/password");
  const { eq } = await import("drizzle-orm");

  // Upsert demo salon
  let salonId: string;
  const existingSalon = await db
    .select({ id: salons.id })
    .from(salons)
    .where(eq(salons.slug, "demo-salon-belle"))
    .limit(1);

  if (existingSalon[0]) {
    salonId = existingSalon[0].id;
    console.log("✓ Salon exists:", salonId);
  } else {
    const [salon] = await db
      .insert(salons)
      .values({
        name: "Salon Belle",
        slug: "demo-salon-belle",
        plan: "pro",
        status: "active",
        mrr: 29900,
        city: "Amsterdam",
        phone: "+31 20 123 4567",
      })
      .returning({ id: salons.id });
    salonId = salon.id;
    console.log("✓ Created salon:", salonId);
  }

  // Upsert owner user
  const email = "kapper@demo.nl";
  const hash = await hashPassword("Demo1234!");
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser[0]) {
    await db
      .update(users)
      .set({ passwordHash: hash, role: "owner", salonId, name: "Sophie Bakker" })
      .where(eq(users.id, existingUser[0].id));
    console.log("✓ Updated owner user");
  } else {
    await db.insert(users).values({
      email,
      name: "Sophie Bakker",
      passwordHash: hash,
      role: "owner",
      salonId,
    });
    console.log("✓ Created owner user");
  }

  console.log("\nKlaar. Inloggen met:");
  console.log("  E-mail: kapper@demo.nl");
  console.log("  Wachtwoord: Demo1234!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
