"use server";

import { randomBytes, createHash } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/mail/resend";
import { publicEnv } from "@/lib/env";

function shell(title: string, inner: string): string {
  const BRAND = "#526350";
  const CREAM = "#fbf9f8";
  const INK = "#1b1c1c";
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"></head>
<body style="margin:0;background:${CREAM};font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="font-size:22px;font-weight:700;color:${BRAND};margin-bottom:24px;">KapperAssistent.nl</div>
    <div style="background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(143,161,139,.12);">
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px;color:${INK};">${title}</h1>
      ${inner}
    </div>
    <p style="font-size:12px;color:#747871;text-align:center;margin-top:24px;">© ${new Date().getFullYear()} KapperAssistent.nl</p>
  </div>
</body></html>`;
}

const IDENTIFIER_PREFIX = "reset:";

export interface ResetResult {
  ok: boolean;
  error?: string;
}

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(8, "Minimaal 8 tekens")
  .regex(/[A-Z]/, "Minimaal één hoofdletter")
  .regex(/[0-9]/, "Minimaal één cijfer");

export async function requestPasswordReset(email: string): Promise<ResetResult> {
  const parsed = emailSchema.safeParse(email.toLowerCase().trim());
  if (!parsed.success) return { ok: false, error: "Ongeldig e-mailadres." };

  const normalizedEmail = parsed.data;

  // Always return ok to prevent user enumeration
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user[0]) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const identifier = `${IDENTIFIER_PREFIX}${normalizedEmail}`;
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
    await db.insert(verificationTokens).values({ identifier, token: tokenHash, expires });

    const resetUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/reset-password/${rawToken}`;
    const inner = `
      <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">We hebben een verzoek ontvangen om je wachtwoord te resetten.</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Klik op de knop hieronder om een nieuw wachtwoord in te stellen. De link vervalt over 1 uur.</p>
      <div style="margin-bottom:24px;"><a href="${resetUrl}" style="display:inline-block;background:#526350;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px;">Wachtwoord instellen →</a></div>
      <p style="font-size:13px;color:#747871;">Heb je dit niet aangevraagd? Geen actie nodig, de link vervalt vanzelf.</p>
    `;
    await sendEmail({
      to: normalizedEmail,
      subject: "Wachtwoord resetten — KapperAssistent",
      html: shell("Wachtwoord resetten", inner),
    });
  }

  return { ok: true };
}

export async function validateResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();

  const rows = await db
    .select({ identifier: verificationTokens.identifier, expires: verificationTokens.expires })
    .from(verificationTokens)
    .where(and(eq(verificationTokens.token, tokenHash), gt(verificationTokens.expires, now)))
    .limit(1);

  if (!rows[0]) return null;
  return rows[0].identifier.replace(IDENTIFIER_PREFIX, "");
}

export async function applyPasswordReset(
  rawToken: string,
  newPassword: string,
): Promise<ResetResult> {
  const passwordResult = passwordSchema.safeParse(newPassword);
  if (!passwordResult.success) {
    return { ok: false, error: passwordResult.error.issues[0]?.message };
  }

  const email = await validateResetToken(rawToken);
  if (!email) return { ok: false, error: "Link ongeldig of verlopen." };

  const passwordHash = await hashPassword(newPassword);
  const updated = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, email))
    .returning({ id: users.id });

  if (!updated[0]) return { ok: false, error: "Gebruiker niet gevonden." };

  // Consume the token
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `${IDENTIFIER_PREFIX}${email}`));

  return { ok: true };
}
