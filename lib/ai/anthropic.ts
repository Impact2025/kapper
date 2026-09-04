import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      // Unset: defaults to https://api.anthropic.com. Set to any gateway
      // implementing the same Messages API (OpenModel, OpenRouter, ...) to
      // route through it instead — same request/response shape, same
      // tool-use format, just a different gateway. See lib/env.ts.
      baseURL: env.ANTHROPIC_BASE_URL || undefined,
    });
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
