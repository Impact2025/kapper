"use server";

import { redirect } from "next/navigation";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email("Vul een geldig e-mailadres in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

const RATE_LIMIT_WINDOW_MIN = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

/** DB-backed (not in-memory) so it holds across serverless instances. */
async function recentFailedLogins(email: string): Promise<number> {
  if (!env.DATABASE_URL) return 0;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60_000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        eq(events.type, "login_failed"),
        sql`${events.props} ->> 'email' = ${email}`,
        gte(events.createdAt, since),
      ),
    );
  return Number(row?.n ?? 0);
}

export interface LoginState {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
}

export async function login(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!env.DATABASE_URL) {
    return { error: "Database niet geconfigureerd. Stel DATABASE_URL in." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { password } = parsed.data;

  if ((await recentFailedLogins(email)) >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { error: "Te veel mislukte inlogpogingen. Probeer het over 15 minuten opnieuw." };
  }

  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    await trackEvent({ type: "login_failed", props: { email } });
    // Generic message — don't reveal whether the email exists.
    return { error: "Onjuiste inloggegevens." };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "owner" ? "/dashboard" : "/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
