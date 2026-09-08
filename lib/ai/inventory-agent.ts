import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/ai/anthropic";
import { listProducts, getLowStockProducts, getSalesVelocity } from "@/lib/webwinkel/queries";
import { env } from "@/lib/env";
import { captureError } from "@/lib/observability";

export interface InventoryChatMessage {
  role: "user" | "assistant";
  content: string;
}

const FALLBACK_NL =
  "Op dit moment kan ik je voorraadvraag niet verwerken. Probeer het straks opnieuw.";

const MAX_TOOL_ROUNDS = 3;
/** Sales velocity lookback window used both by the reorder tool and the
 * standalone `getReorderSuggestions` widget on the dashboard. */
const VELOCITY_WINDOW_DAYS = 30;

export const INVENTORY_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_stock_overview",
    description: "Geef een overzicht van alle producten met hun huidige voorraad, drempelwaarde en status.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_low_stock_products",
    description: "Geef alleen de producten die op of onder hun lage-voorraaddrempel zitten.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_reorder_suggestions",
    description:
      "Bereken herbestel-suggesties op basis van verkoopsnelheid over de laatste 30 dagen en de huidige voorraad — geeft per product een geadviseerd aantal om bij te bestellen zodat er weer 30 dagen voorraad is.",
    input_schema: { type: "object", properties: {} },
  },
];

/** Reorder quantity so stock covers another `VELOCITY_WINDOW_DAYS` days at
 * the observed sales pace, topped up to at least the low-stock threshold. */
function suggestReorderQuantity(stockQuantity: number, lowStockThreshold: number, unitsSoldInWindow: number): number {
  const targetStock = Math.max(lowStockThreshold * 2, unitsSoldInWindow);
  return Math.max(0, targetStock - stockQuantity);
}

export async function getReorderSuggestions(salonId: string) {
  const [productRows, velocity] = await Promise.all([
    listProducts(salonId),
    getSalesVelocity(salonId, VELOCITY_WINDOW_DAYS),
  ]);
  const soldById = new Map(velocity.map((v) => [v.productId, v.unitsSold]));

  return productRows
    .filter((p) => p.active)
    .map((p) => {
      const unitsSold = soldById.get(p.id) ?? 0;
      return {
        productId: p.id,
        productName: p.name,
        stockQuantity: p.stockQuantity,
        unitsSoldLast30Days: unitsSold,
        suggestedReorderQuantity: suggestReorderQuantity(p.stockQuantity, p.lowStockThreshold, unitsSold),
      };
    })
    .filter((s) => s.suggestedReorderQuantity > 0 || s.stockQuantity <= 0)
    .sort((a, b) => b.suggestedReorderQuantity - a.suggestedReorderQuantity);
}

async function runTool(name: string, salonId: string): Promise<string> {
  switch (name) {
    case "get_stock_overview": {
      const rows = await listProducts(salonId);
      return JSON.stringify(
        rows.map((p) => ({
          naam: p.name,
          voorraad: p.stockQuantity,
          drempel: p.lowStockThreshold,
          status: p.stockQuantity <= p.lowStockThreshold ? "laag" : "ok",
          actief: p.active,
        })),
      );
    }
    case "get_low_stock_products": {
      const rows = await getLowStockProducts(salonId);
      return JSON.stringify(rows.map((p) => ({ naam: p.name, voorraad: p.stockQuantity, drempel: p.lowStockThreshold })));
    }
    case "get_reorder_suggestions": {
      const suggestions = await getReorderSuggestions(salonId);
      return JSON.stringify(
        suggestions.map((s) => ({
          naam: s.productName,
          huidige_voorraad: s.stockQuantity,
          verkocht_laatste_30_dagen: s.unitsSoldLast30Days,
          advies_bijbestellen: s.suggestedReorderQuantity,
        })),
      );
    }
    default:
      return JSON.stringify({ error: `Onbekende tool: ${name}` });
  }
}

function buildSystemPrompt(salonName: string): string {
  return `Je bent de voorraad-AI-assistent van ${salonName}, een webwinkel-tool voor een kapperszaak. Je communiceert kort en zakelijk in het Nederlands.

GEDRAGSREGELS:
1. Gebruik altijd een van de tools om actuele voorraadcijfers op te halen — verzin nooit zelf aantallen.
2. Geef herbestel-adviezen als concreet aantal per product, met een korte onderbouwing (verkoopsnelheid, huidige voorraad).
3. Je plaatst zelf geen bestellingen — je geeft alleen advies dat de salon-eigenaar zelf uitvoert.
4. Wees beknopt: gebruik bullets bij meerdere producten, geen lange inleidingen.`;
}

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function getInventoryAgentReply(
  salonId: string,
  salonName: string,
  history: InventoryChatMessage[],
): Promise<string> {
  const anthropic = getAnthropic();
  if (!anthropic) return FALLBACK_NL;

  const messages: Anthropic.MessageParam[] = history.slice(-20).map((m) => ({ role: m.role, content: m.content }));

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: env.OPENMODEL_MODEL,
        max_tokens: 768,
        system: buildSystemPrompt(salonName),
        tools: INVENTORY_TOOLS,
        messages,
      });

      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (!toolUses.length || round === MAX_TOOL_ROUNDS) {
        return textOf(response) || FALLBACK_NL;
      }

      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        const resultText = await runTool(toolUse.name, salonId);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: resultText });
      }
      messages.push({ role: "user", content: toolResults });
    }
    return FALLBACK_NL;
  } catch (err) {
    captureError("inventory-agent/claude", err);
    return FALLBACK_NL;
  }
}
