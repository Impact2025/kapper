"use client";

import { useActionState, useState } from "react";
import { generateDraft } from "@/lib/blog/actions";

export interface GenerateVertical {
  id: string;
  label: string;
  topicPlaceholder: string;
  keywordPlaceholder: string;
  suggestions: string[];
}

export function GenerateForm({ verticals }: { verticals: GenerateVertical[] }) {
  const [state, action, pending] = useActionState(generateDraft, undefined);
  const [verticalId, setVerticalId] = useState(verticals[0]?.id ?? "kapper");
  const vertical = verticals.find((v) => v.id === verticalId) ?? verticals[0]!;

  return (
    <form action={action} className="flex flex-col gap-md">
      {verticals.length > 1 && (
        <div className="flex flex-col gap-xs">
          <label htmlFor="vertical" className="text-label-md font-label-md text-on-surface-variant">
            Voor welke site?
          </label>
          <select
            id="vertical"
            name="vertical"
            value={verticalId}
            onChange={(e) => setVerticalId(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
          >
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-xs">
        <label htmlFor="topic" className="text-label-md font-label-md text-on-surface-variant">
          Onderwerp
        </label>
        <input
          id="topic"
          name="topic"
          required
          placeholder={vertical.topicPlaceholder}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
        />
        <div className="flex flex-wrap gap-xs">
          {vertical.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.form?.elements.namedItem("topic") as HTMLInputElement;
                if (input) input.value = s;
              }}
              className="rounded-full bg-surface-container px-sm py-[2px] text-label-sm text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        <label htmlFor="keywords" className="text-label-md font-label-md text-on-surface-variant">
          Keywords (optioneel, komma-gescheiden)
        </label>
        <input
          id="keywords"
          name="keywords"
          placeholder={vertical.keywordPlaceholder}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
        />
      </div>

      {state?.error && (
        <div role="alert" className="rounded-lg bg-error-container px-sm py-xs text-label-md text-on-error-container">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-base self-start rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 soft-shadow"
      >
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        {pending ? "AI schrijft je artikel…" : "Genereer artikel"}
      </button>
      {pending && (
        <p className="text-label-sm text-on-surface-variant">
          Dit kan 10–30 seconden duren. Je wordt automatisch naar de editor gebracht.
        </p>
      )}
    </form>
  );
}
