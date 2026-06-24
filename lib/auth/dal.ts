import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "owner";
  salonId: string | null;
}

/**
 * Verify there's a valid session. Redirects to /login when absent.
 * Memoized for the duration of a render pass.
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

/** Optimistic session read that does NOT redirect (for conditional UI). */
export const optionalSession = cache(async (): Promise<SessionPayload | null> => {
  return getSession();
});

/**
 * Load the authenticated user from the database. Redirects to /login if the
 * session is invalid or the user no longer exists. Always runs verifySession,
 * so any data fetched through it is gated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await verifySession();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      salonId: users.salonId,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = rows[0];
  if (!user) redirect("/login");
  return user;
});

/** Require a specific role; redirect to the dashboard root if insufficient. */
export async function requireRole(role: "admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.role !== role) redirect("/admin");
  return user;
}

/** Require an authenticated salon owner with a linked salon. */
export async function requireSalonOwner(): Promise<CurrentUser & { salonId: string }> {
  const user = await getCurrentUser();
  if (user.role !== "owner") redirect("/admin");
  if (!user.salonId) redirect("/dashboard/setup");
  return user as CurrentUser & { salonId: string };
}
