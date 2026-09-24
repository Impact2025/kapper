"use client";

import { useActionState, useState } from "react";
import { renderMarkdown } from "@/lib/blog/markdown";
import { saveArticleAction, type SaveArticleState } from "@/lib/help/actions";
import { HELP_CATEGORIES } from "@/lib/help/articles";

export interface EditorValues {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  keywords: string;
  related: string;
  audience: string;
  hidden: boolean;
}

const FIELD =
  "w-full rounded-lg border border-outline-variant bg-white px-md py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ArticleEditor({ initial, slugLocked }: { initial: EditorValues; slugLocked: boolean }) {
  const [state, action, pending] = useActionState<SaveArticleState, FormData>(saveArticleAction, {});
  const [body, setBody] = useState(initial.body);
  const [summary, setSummary] = useState(initial.summary);

  return (
    <form action={action} className="grid grid-cols-1 gap-lg xl:grid-cols-2">
      <div className="space-y-md">
        {state.error && (
          <div role="alert" className="rounded-lg bg-error-container p-sm text-label-md text-on-error-container">
            {state.error}
          </div>
        )}

        <label className="block">
          <span className="mb-xs block text-label-md font-label-md">Titel (de vraag) *</span>
          <input name="title" defaultValue={initial.title} required minLength={5} maxLength={160} className={FIELD} />
        </label>

        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">Slug (URL) *</span>
            <input
              name="slug"
              defaultValue={initial.slug}
              readOnly={slugLocked}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={`${FIELD} ${slugLocked ? "bg-surface-container-low" : ""}`}
            />
          </label>
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">Categorie *</span>
            <select name="category" defaultValue={initial.category} className={FIELD}>
              {HELP_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-xs block text-label-md font-label-md">Kort antwoord (ook FAQ-schema en chat) *</span>
          <textarea
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            minLength={10}
            maxLength={400}
            rows={3}
            className={`${FIELD} resize-y`}
          />
        </label>

        <label className="block">
          <span className="mb-xs block text-label-md font-label-md">Uitleg (Markdown) *</span>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            minLength={20}
            rows={14}
            className={`${FIELD} resize-y font-mono text-label-md`}
          />
          <span className="mt-xs block text-label-sm text-on-surface-variant">
            Ondersteund: ## koppen, lijsten (- of 1.), **vet**, *cursief*, [links](/pad), `code`. Geen tabellen.
          </span>
        </label>

        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">Zoektermen (komma-gescheiden)</span>
            <input name="keywords" defaultValue={initial.keywords} className={FIELD} placeholder="opzeggen, stopzetten, annuleren" />
          </label>
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">Gerelateerde slugs</span>
            <input name="related" defaultValue={initial.related} className={FIELD} placeholder="hoe-zeg-ik-op, gratis-proefperiode" />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-lg">
          <label className="block">
            <span className="mb-xs block text-label-md font-label-md">Voor wie</span>
            <select name="audience" defaultValue={initial.audience} className={FIELD}>
              <option value="both">Iedereen</option>
              <option value="prospect">Prospects</option>
              <option value="salon">Salons (klanten)</option>
            </select>
          </label>
          <label className="mt-md inline-flex items-center gap-xs text-label-md">
            <input type="checkbox" name="hidden" defaultChecked={initial.hidden} />
            Verborgen (niet publiek, niet in chat)
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Opslaan en publiceren"}
        </button>
      </div>

      <div>
        <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Voorbeeld</h2>
        <div className="rounded-xl border border-outline-variant/50 bg-surface p-lg">
          <p className="mb-md rounded-xl bg-primary-fixed/40 p-md text-body-md text-on-surface">{summary || "Kort antwoord…"}</p>
          <div
            className="prose-blog flex flex-col gap-md text-body-md text-on-surface"
            // renderMarkdown escapes HTML first; only http(s)/relative links survive.
            dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
          />
        </div>
      </div>
    </form>
  );
}
