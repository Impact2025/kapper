import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { MaskingSession } from "@/lib/ai/masking";

let client: Anthropic | null = null;

/**
 * PII-masking gateway (Protecto-methode): wraps `messages.create` so every
 * caller's outgoing message content is de-identified before it reaches
 * Anthropic, and the model's reply is re-identified before it comes back.
 * A fresh MaskingSession per call — the token↔value mapping lives only in
 * that call's stack memory and is discarded once the request completes.
 */
export function withPiiMasking(anthropic: Anthropic): Anthropic {
  const originalCreate = anthropic.messages.create.bind(anthropic.messages);
  anthropic.messages.create = (async (params: Anthropic.MessageCreateParams, options?: unknown) => {
    const session = new MaskingSession();
    const maskedMessages = params.messages.map((m) => maskMessageParam(m, session));
    const response = await originalCreate({ ...params, messages: maskedMessages }, options as never);
    if ("content" in response) {
      response.content = response.content.map((block) =>
        block.type === "text" ? { ...block, text: session.unmask(block.text) } : block,
      );
    }
    return response;
  }) as Anthropic["messages"]["create"];
  return anthropic;
}

function maskMessageParam(m: Anthropic.MessageParam, session: MaskingSession): Anthropic.MessageParam {
  if (typeof m.content === "string") {
    return { ...m, content: session.mask(m.content) };
  }
  return {
    ...m,
    content: m.content.map((block) => {
      if (block.type === "text") return { ...block, text: session.mask(block.text) };
      if (block.type === "tool_result" && typeof block.content === "string") {
        return { ...block, content: session.mask(block.content) };
      }
      return block;
    }),
  };
}

export function getAnthropic(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = withPiiMasking(
      new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
        // Unset: defaults to https://api.anthropic.com. Set to any gateway
        // implementing the same Messages API (OpenModel, OpenRouter, ...) to
        // route through it instead — same request/response shape, same
        // tool-use format, just a different gateway. See lib/env.ts.
        baseURL: env.ANTHROPIC_BASE_URL || undefined,
      }),
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
}): Promise<string | null> {
  const anthropic = getAnthropic();
  if (!anthropic) return null;

  const msg = await anthropic.messages.create({
    model: opts.model ?? env.ANTHROPIC_MODEL_FAST,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
