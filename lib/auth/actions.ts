"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { env } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email("Vul een geldig e-mailadres in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

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

  const { email, password } = parsed.data;
  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  const user = rows[0];
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
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
