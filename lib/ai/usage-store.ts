import "server-only";
import { db } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { costMicroEur, parsePricing, usdToMicroEur } from "@/lib/ai/pricing";

const pricing = parsePricing(env.AI_PRICING_JSON);

export interface AiUsageInput {
  salonId: string | null;
  feature: string;
  kind: "llm" | "voice";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  voiceSeconds?: number;
  latencyMs?: number | null;
  /** Voice only: provider-reported cost in USD (Vapi end-of-call `cost`). */
  providerCostUsd?: number | null;
}

/** Insert one metered call. Best-effort: logs and swallows DB errors. */
export async function recordAiUsage(input: AiUsageInput): Promise<void> {
  if (!env.DATABASE_URL) return;
  const tokens = {
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    cacheReadTokens: input.cacheReadTokens ?? 0,
    cacheWriteTokens: input.cacheWriteTokens ?? 0,
  };
  const cost =
    input.kind === "voice"
      ? usdToMicroEur(input.providerCostUsd, env.USD_EUR_RATE)
      : costMicroEur(input.model, tokens, pricing);
  try {
    await db.insert(aiUsage).values({
      salonId: input.salonId,
      feature: input.feature,
      kind: input.kind,
      model: input.model,
      ...tokens,
      voiceSeconds: Math.round(input.voiceSeconds ?? 0),
      costMicroEur: cost,
      latencyMs: input.latencyMs ?? null,
    });
  } catch (err) {
    console.error("[ai-usage] insert failed:", err);
  }
}
