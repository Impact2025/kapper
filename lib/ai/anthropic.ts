import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { MaskingSession, getKnownPiiNames } from "@/lib/ai/masking";
import { currentAiContext, reportGatewayUsage, runWithAiContext, toGatewayUsage, type GatewayUsage } from "@/lib/ai/usage-context";

let client: Anthropic | null = null;

/**
 * PII-masking gateway (Protecto-methode): wraps `messages.create` so every
 * caller's outgoing message content is de-identified before it reaches
 * Anthropic, and the model's reply is re-identified before it comes back.
 * A fresh MaskingSession per call — the token↔value mapping lives only in
 * that call's stack memory and is discarded once the request completes.
 *
 * Tool-use input is re-identified too: otherwise a model that only ever saw
 * `[KLANT_NAAM_1]` would book the appointment under that literal token. The
 * real values then sit in the tool-loop history, so outgoing tool_use
 * blocks are masked again on the next round (same text → same tokens).
 *
 * `system` is deliberately NOT masked: it holds operator instructions that
 * themselves name health terms ("bij allergie: escalate_to_staff"), and
 * tokenizing those would blind the model to its own rules. Contract for
 * every caller: customer data goes in `messages`, never in `system`.
 * Image blocks can't be masked either — see the privacy page for how photos
 * are disclosed.
 *
 * `onUsage` is the platform-cockpit meter: called once per completed call
 * with tokens + latency (see lib/ai/usage-context.ts).
 */
export function withPiiMasking(anthropic: Anthropic, onUsage?: (usage: GatewayUsage) => void): Anthropic {
  const originalCreate = anthropic.messages.create.bind(anthropic.messages);
  anthropic.messages.create = (async (params: Anthropic.MessageCreateParams, options?: unknown) => {
    const session = new MaskingSession();
    const names = getKnownPiiNames();
    const mask = (text: string) => session.mask(text, names);
    const maskedMessages = params.messages.map((m) => maskMessageParam(m, mask));
    const startedAt = Date.now();
    const response = await originalCreate({ ...params, messages: maskedMessages }, options as never);
    if (onUsage && "usage" in response) {
      onUsage(toGatewayUsage(params.model, response.usage as unknown as Record<string, unknown>, Date.now() - startedAt));
    }
    if ("content" in response) {
      const unmask = (text: string) => session.unmask(text);
      response.content = response.content.map((block) => {
        if (block.type === "text") return { ...block, text: unmask(block.text) };
        if (block.type === "tool_use") return { ...block, input: mapStrings(block.input, unmask) };
        return block;
      });
    }
    return response;
  }) as Anthropic["messages"]["create"];
  return anthropic;
}

/** Applies `fn` to every string inside a JSON-like value (tool input). */
function mapStrings(value: unknown, fn: (s: string) => string): unknown {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  }
  return value;
}

function maskMessageParam(m: Anthropic.MessageParam, mask: (text: string) => string): Anthropic.MessageParam {
  if (typeof m.content === "string") {
    return { ...m, content: mask(m.content) };
  }
  return {
    ...m,
    content: m.content.map((block) => {
      if (block.type === "text") return { ...block, text: mask(block.text) };
      if (block.type === "tool_use") return { ...block, input: mapStrings(block.input, mask) };
      if (block.type === "tool_result") {
        if (typeof block.content === "string") return { ...block, content: mask(block.content) };
        if (Array.isArray(block.content)) {
          return {
            ...block,
            content: block.content.map((c) => (c.type === "text" ? { ...c, text: mask(c.text) } : c)),
          };
        }
      }
      return block;
    }),
  };
}

export function getAnthropic(): Anthropic | null {
  if (!env.OPENMODEL_API_KEY) return null;
  if (!client) {
    client = withPiiMasking(
      new Anthropic({
        apiKey: env.OPENMODEL_API_KEY,
        baseURL: env.OPENMODEL_BASE_URL,
      }),
      reportGatewayUsage,
    );
  }
  return client;
}

/** Convenience: single-shot text completion. Returns null if no API key. */
export async function complete(opts: {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  /** Cockpit metering label (blog, report, scan, …). */
  feature?: string;
  salonId?: string | null;
}): Promise<string | null> {
  const anthropic = getAnthropic();
  if (!anthropic) return null;

  const msg = await runWithAiContext({ feature: opts.feature ?? currentAiContext()?.feature ?? "overig", salonId: opts.salonId }, () =>
    anthropic.messages.create({
      model: opts.model ?? env.OPENMODEL_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  );

  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
