import "server-only";
import { redirect } from "next/navigation";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { getVerticalConfig, type VerticalPack } from "@/lib/verticals";
import { salonHasPlan, type Plan } from "@/lib/salon/plan";

/**
 * Minimum plan per klus-CRM capability. This is the single source the pricing
 * copy in lib/verticals/plans.ts must match (cross-check when either changes —
 * see the pricing/marketing audit note).
 */
export const JOB_FEATURE_MIN_PLAN = {
  jobs: "essential",
  quotes: "pro",
  assets: "pro",
  contracts: "pro",
} as const satisfies Record<string, Plan>;

export type JobFeature = keyof typeof JOB_FEATURE_MIN_PLAN;

export interface JobContext {
  userId: string;
  userName: string | null;
  salonId: string;
  salonName: string;
  plan: Plan;
  pack: VerticalPack;
  settings: Record<string, unknown>;
  can: Record<JobFeature, boolean>;
}

export function jobCapabilities(plan: string, pack: VerticalPack): Record<JobFeature, boolean> {
  return {
    jobs: pack.features.jobs && salonHasPlan(plan, JOB_FEATURE_MIN_PLAN.jobs),
    quotes: pack.features.quotes && salonHasPlan(plan, JOB_FEATURE_MIN_PLAN.quotes),
    assets: pack.features.assets && salonHasPlan(plan, JOB_FEATURE_MIN_PLAN.assets),
    contracts: pack.features.contracts && salonHasPlan(plan, JOB_FEATURE_MIN_PLAN.contracts),
  };
}

/**
 * Gate for every /dashboard/klussen|planbord|facturatie|onderhoud page and
 * server action: an authenticated owner of a *job-archetype* salon. A kapper
 * salon that guesses the URL is bounced to the dashboard root.
 */
export async function requireJobOwner(): Promise<JobContext> {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);
  if (!salon) redirect("/dashboard/setup");
  const pack = getVerticalConfig(salon.vertical);
  if (pack.archetype !== "job") redirect("/dashboard");
  return {
    userId: user.id,
    userName: user.name,
    salonId: salon.id,
    salonName: salon.name,
    plan: salon.plan,
    pack,
    settings: salon.settings,
    can: jobCapabilities(salon.plan, pack),
  };
}

export const UPGRADE_QUOTES = "Offertes en facturen zijn onderdeel van het Pro-abonnement. Upgrade via Abonnement.";
export const UPGRADE_ASSETS = "Het installatiepaspoort is onderdeel van het Pro-abonnement. Upgrade via Abonnement.";
export const UPGRADE_CONTRACTS = "Onderhoudscontracten zijn onderdeel van het Pro-abonnement. Upgrade via Abonnement.";

/**
 * Non-redirecting variant for pages shared between archetypes (klanten,
 * dashboard home): returns the job context for a job-archetype salon, or null
 * for kapper — the caller then renders its existing appointment-based view.
 */
export async function getJobContextOrNull(salonId: string, user: { id: string; name: string | null }): Promise<JobContext | null> {
  const salon = await getSalonWithSubscription(salonId);
  if (!salon) return null;
  const pack = getVerticalConfig(salon.vertical);
  if (pack.archetype !== "job") return null;
  return {
    userId: user.id,
    userName: user.name,
    salonId: salon.id,
    salonName: salon.name,
    plan: salon.plan,
    pack,
    settings: salon.settings,
    can: jobCapabilities(salon.plan, pack),
  };
}
