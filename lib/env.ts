import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 * Server-only values must never be imported into client components.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url().optional(),

  // Auth (M2)
  AUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Mail (Resend)
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("KapperAssistent <no-reply@kappersassistent.nl>"),
  REPORT_RECIPIENT: z.string().default("v.munster@weareimpact.nl"),

  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL_LONGFORM: z.string().default("claude-opus-4-8"),
  ANTHROPIC_MODEL_FAST: z.string().default("claude-haiku-4-5-20251001"),

  // SEO scan
  PAGESPEED_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  // Billing (M5)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Cron protection
  CRON_SECRET: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://kappersassistent.nl"),
});

// Vercel sets unassigned env vars to "" at build time; strip them so
// .optional()/.default() in Zod fire correctly instead of failing URL checks.
const cleanedEnv = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
);

export const env = serverSchema.parse(cleanedEnv);
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});
