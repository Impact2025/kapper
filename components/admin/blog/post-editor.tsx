"use client";

import { useActionState, useState, useMemo } from "react";
import { savePost } from "@/lib/blog/actions";
import { computeSeo } from "@/lib/blog/seo";
import { Icon } from "@/components/ui/icon";

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  bodyMdx: string;
}

const inputCls =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary";

export function PostEditor({ post }: { post: PostData }) {
  const [state, action, pending] = useActionState(savePost, undefined);

  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [metaTitle, setMetaTitle] = useState(post.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post.metaDescription ?? "");
  const [keywords, setKeywords] = useState(post.keywords.join(", "));
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [bodyMdx, setBodyMdx] = useState(post.bodyMdx);

  const seo = useMemo(
    () =>
      computeSeo({
        title,
        metaTitle: metaTitle || title,
        metaDescription,
        bodyMdx,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        slug,
      }),
    [title, metaTitle, metaDescription, bodyMdx, keywords, slug],
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-md lg:grid-cols-3">
      <input type="hidden" name="id" value={post.id} />

      <div className="flex flex-col gap-sm lg:col-span-2">
        <Field label="Titel">
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Slug">
          <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Samenvatting (excerpt)">
          <textarea name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputCls} />
        </Field>
        <Field label="Body (Markdown)">
          <textarea
            name="bodyMdx"
            value={bodyMdx}
            onChange={(e) => setBodyMdx(e.target.value)}
            rows={22}
            required
            className={`${inputCls} font-mono text-label-md`}
          />
        </Field>

        {state?.error && (
          <div role="alert" className="rounded-lg bg-error-container px-sm py-xs text-label-md text-on-error-container">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-lg bg-primary-fixed px-sm py-xs text-label-md text-on-primary-fixed">
            Opgeslagen ✓
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 soft-shadow"
        >
          {pending ? "Opslaan…" : "Wijzigingen opslaan"}
        </button>
      </div>

      {/* SEO sidebar */}
      <div className="flex flex-col gap-sm">
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
          <div className="mb-sm flex items-center justify-between">
            <span className="text-label-md font-label-md text-on-surface-variant">SEO-score</span>
            <span
              className={
                seo.score >= 80
                  ? "font-headline-md text-headline-md text-primary"
                  : seo.score >= 50
                    ? "font-headline-md text-headline-md text-secondary"
                    : "font-headline-md text-headline-md text-error"
              }
            >
              {seo.score}
            </span>
          </div>
          <ul className="flex flex-col gap-xs">
            {seo.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-xs text-label-md">
                <Icon
                  name={c.ok ? "check_circle" : "cancel"}
                  className={c.ok ? "text-[18px] text-primary" : "text-[18px] text-outline"}
                />
                <span className={c.ok ? "text-on-surface-variant" : "text-on-surface"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <Field label="Meta-titel">
          <input name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} />
          <span className="text-label-sm text-on-surface-variant">{(metaTitle || title).length} tekens</span>
        </Field>
        <Field label="Meta-omschrijving">
          <textarea
            name="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={3}
            className={inputCls}
          />
          <span className="text-label-sm text-on-surface-variant">{metaDescription.length} tekens</span>
        </Field>
        <Field label="Keywords (komma-gescheiden)">
          <input name="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputCls} />
        </Field>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-md font-label-md text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
