import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Who an AI call is "for". Set once at an entry point (receptionist turn,
 * support chat, blog generation, …) with runWithAiContext; the gateway in
 * lib/ai/anthropic.ts reads it for every messages.create underneath, so call
 * sites don't have to thread salonId through their tool loops.
 *
 * Deliberately free of DB imports: tests import the gateway, and persistence
 * is loaded lazily (lib/ai/usage-store.ts) only when a real call finishes.
 */
export interface AiContext {
  salonId?: string | null;
  feature: string;
}

export interface GatewayUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  latencyMs: number;
}

const storage = new AsyncLocalStorage<AiContext>();

/** Run `fn` with an AI context. An inner context inherits the outer salonId unless it sets its own. */
export function runWithAiContext<T>(ctx: AiContext, fn: () => T): T {
  const outer = storage.getStore();
  return storage.run({ ...ctx, salonId: ctx.salonId ?? outer?.salonId ?? null }, fn);
}

export function currentAiContext(): AiContext | undefined {
  return storage.getStore();
}

/** Map an Anthropic-style usage object onto our row shape (missing fields → 0). */
export function toGatewayUsage(
  model: string,
  usage: Record<string, unknown> | null | undefined,
  latencyMs: number,
): GatewayUsage {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    model,
    inputTokens: n(usage?.input_tokens),
    outputTokens: n(usage?.output_tokens),
    cacheReadTokens: n(usage?.cache_read_input_tokens),
    cacheWriteTokens: n(usage?.cache_creation_input_tokens),
    latencyMs: Math.max(0, Math.round(latencyMs)),
  };
}

/**
 * Persist one gateway call without delaying the reply: scheduled with Next's
 * after() inside a request, fire-and-forget outside one (scripts, cron edge
 * cases). Never throws — metering must not break a customer conversation.
 */
export function reportGatewayUsage(usage: GatewayUsage): void {
  const ctx = currentAiContext();
  const persist = () =>
    import("@/lib/ai/usage-store")
      .then((m) =>
        m.recordAiUsage({ ...usage, salonId: ctx?.salonId ?? null, feature: ctx?.feature ?? "overig", kind: "llm" }),
      )
      .catch((err) => console.error("[ai-usage] record failed:", err));

  void import("next/server")
    .then(({ after }) => {
      try {
        after(persist);
      } catch {
        void persist();
      }
    })
    .catch(() => void persist());
}
