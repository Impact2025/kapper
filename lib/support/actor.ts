import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, users } from "@/lib/db/schema";
import { optionalSession } from "@/lib/auth/dal";
import { env } from "@/lib/env";

export interface SupportActor {
  audience: "prospect" | "salon";
  role: "admin" | "owner" | null;
  userId: string | null;
  name: string | null;
  email: string | null;
  salon: { id: string; plan: string } | null;
}

const ANONYMOUS: SupportActor = { audience: "prospect", role: null, userId: null, name: null, email: null, salon: null };

/**
 * Who is talking to support? Only a logged-in salon *owner* with a linked
 * salon counts as "salon" (and unlocks account tools / SLA tier). Everyone
 * else — including admins browsing the marketing site — is a prospect.
 */
export async function getSupportActor(): Promise<SupportActor> {
  if (!env.DATABASE_URL) return ANONYMOUS;
  const session = await optionalSession();
  if (!session?.userId) return ANONYMOUS;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, salonId: users.salonId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return ANONYMOUS;
  if (user.role !== "owner" || !user.salonId) {
    return { ...ANONYMOUS, role: user.role, userId: user.id, name: user.name, email: user.email };
  }

  const [salon] = await db.select({ id: salons.id, plan: salons.plan }).from(salons).where(eq(salons.id, user.salonId)).limit(1);
  return {
    audience: "salon",
    role: "owner",
    userId: user.id,
    name: user.name,
    email: user.email,
    salon: salon ? { id: salon.id, plan: salon.plan } : null,
  };
}
