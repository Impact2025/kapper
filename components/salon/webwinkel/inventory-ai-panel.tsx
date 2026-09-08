"use client";

import { useState, useTransition } from "react";
import { askInventoryAgent } from "@/lib/webwinkel/actions";
import { Card } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import type { InventoryChatMessage } from "@/lib/ai/inventory-agent";

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  stockQuantity: number;
  unitsSoldLast30Days: number;
  suggestedReorderQuantity: number;
}

export function InventoryAiPanel({ suggestions }: { suggestions: ReorderSuggestion[] }) {
  const [messages, setMessages] = useState<InventoryChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    const next: InventoryChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const result = await askInventoryAgent(next);
      if ("reply" in result) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: result.error }]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <Card>
        <h3 className="mb-sm text-body-md font-medium text-on-surface">Herbestel-advies</h3>
        {suggestions.length === 0 ? (
          <p className="text-label-sm text-on-surface-variant">
            Geen herbestel-adviezen op dit moment — voorraad ziet er goed uit.
          </p>
        ) : (
          <div className="flex flex-col gap-xs">
            {suggestions.map((s) => (
              <div key={s.productId} className="flex items-center justify-between gap-sm border-b border-outline-variant/30 py-xs last:border-0">
                <div>
                  <div className="text-body-md text-on-surface">{s.productName}</div>
                  <div className="text-label-sm text-on-surface-variant">
                    voorraad {s.stockQuantity} · verkocht (30d): {s.unitsSoldLast30Days}
                  </div>
                </div>
                <span className="text-label-md font-label-md text-primary">+{s.suggestedReorderQuantity}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-sm">
        <h3 className="text-body-md font-medium text-on-surface">Vraag het de voorraad-AI</h3>
        <div className="flex max-h-72 flex-col gap-sm overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-label-sm text-on-surface-variant">
              Bijvoorbeeld: &quot;Welke producten moet ik deze week bijbestellen?&quot;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end rounded-xl bg-primary px-sm py-xs text-body-md text-on-primary"
                  : "self-start rounded-xl bg-surface-container-high px-sm py-xs text-body-md text-on-surface"
              }
            >
              {m.content}
            </div>
          ))}
          {pending && <div className="self-start text-label-sm text-on-surface-variant">Bezig met nadenken…</div>}
        </div>
        <div className="flex items-center gap-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Typ je vraag…"
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={send}
            disabled={pending}
            className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            <Icon name="send" className="text-[18px]" />
          </button>
        </div>
      </Card>
    </div>
  );
}
