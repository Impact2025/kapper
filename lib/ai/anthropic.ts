import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
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
