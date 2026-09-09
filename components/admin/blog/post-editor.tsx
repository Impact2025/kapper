"use client";

import { useActionState, useState, useMemo, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { savePost } from "@/lib/blog/actions";
import { computeSeo } from "@/lib/blog/seo";
import { Icon } from "@/components/ui/icon";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  bodyMdx: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  audioUrl: string | null;
  audioTitle: string | null;
  audioDurationSeconds: number | null;
  transcript: string | null;
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

  const [coverImage, setCoverImage] = useState(post.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post.coverImageAlt ?? "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [audioUrl, setAudioUrl] = useState(post.audioUrl ?? "");
  const [audioTitle, setAudioTitle] = useState(post.audioTitle ?? "");
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(post.audioDurationSeconds ?? 0);
  const [transcript, setTranscript] = useState(post.transcript ?? "");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload mislukt");
      setCoverImage(result.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload mislukt");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const getAudioDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const audioEl = document.createElement("audio");
        audioEl.preload = "metadata";
        audioEl.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(Number.isFinite(audioEl.duration) ? Math.round(audioEl.duration) : 0);
        };
        audioEl.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(0);
        };
        audioEl.src = url;
      } catch {
        resolve(0);
      }
    });

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploadingAudio(true);
    try {
      const duration = await getAudioDuration(file);
      const blob = await upload(`podcasts/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/audio",
      });
      setAudioUrl(blob.url);
      setAudioDurationSeconds(duration);
      if (!audioTitle) setAudioTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Audio uploaden mislukt");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <form action={action} className="grid grid-cols-1 gap-md lg:grid-cols-3">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="coverImage" value={coverImage} />
      <input type="hidden" name="coverImageAlt" value={coverImageAlt} />
      <input type="hidden" name="audioUrl" value={audioUrl} />
      <input type="hidden" name="audioTitle" value={audioTitle} />
      <input type="hidden" name="audioDurationSeconds" value={audioDurationSeconds || ""} />
      <input type="hidden" name="transcript" value={transcript} />

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

        {/* Cover image */}
        <Field label="Cover-afbeelding">
          <div className="flex items-start gap-sm">
            {coverImage ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="" className="h-28 w-44 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error"
                >
                  <Icon name="close" className="text-[14px]" />
                </button>
              </div>
            ) : (
              <label className="flex h-28 w-44 cursor-pointer flex-col items-center justify-center gap-xs rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary">
                <Icon name={isUploadingCover ? "progress_activity" : "upload"} className="text-[24px]" />
                <span className="text-label-sm">{isUploadingCover ? "Uploaden…" : "Uploaden"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverUpload} className="hidden" disabled={isUploadingCover} />
              </label>
            )}
            <input
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              placeholder="Alt-tekst (SEO)"
              className={`${inputCls} flex-1`}
            />
          </div>
        </Field>

        <Field label="Inhoud">
          <input type="hidden" name="bodyMdx" value={bodyMdx} />
          <RichTextEditor content={bodyMdx} onChange={setBodyMdx} placeholder="Start met schrijven…" />
        </Field>

        {/* Podcast / audio */}
        <div className="flex flex-col gap-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
          <div className="flex items-center gap-xs text-label-md font-label-md text-on-surface">
            <Icon name="podcasts" className="text-[18px] text-primary" />
            Podcast (audio)
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Upload een audio-aflevering bij dit artikel. Voeg een transcript toe voor extra SEO — die tekst wordt geïndexeerd.
          </p>

          <div className="rounded-lg border-2 border-dashed border-outline-variant p-md hover:border-primary">
            {audioUrl ? (
              <div className="flex flex-col gap-sm">
                <audio controls src={audioUrl} className="w-full" />
                <div className="flex items-center justify-between">
                  <span className="text-label-sm text-on-surface-variant">
                    {audioDurationSeconds
                      ? `${Math.floor(audioDurationSeconds / 60)}:${(audioDurationSeconds % 60).toString().padStart(2, "0")} min`
                      : "Audio geüpload"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUrl("");
                      setAudioDurationSeconds(0);
                    }}
                    className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-sm text-error hover:bg-error-container"
                  >
                    <Icon name="delete" className="text-[16px]" /> Verwijderen
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-xs text-on-surface-variant">
                <Icon name={isUploadingAudio ? "progress_activity" : "mic"} className="text-[24px]" />
                <span className="text-label-sm">{isUploadingAudio ? "Uploaden…" : "Klik om podcast te uploaden"}</span>
                <span className="text-label-sm text-on-surface-variant/70">M4A, MP3, WAV (max 150MB)</span>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mp4,audio/x-m4a,audio/aac,audio/mpeg,audio/wav,.m4a,.mp3,.wav"
                  onChange={handleAudioUpload}
                  className="hidden"
                  disabled={isUploadingAudio}
                />
              </label>
            )}
          </div>

          {audioUrl && (
            <>
              <Field label="Aflevering titel">
                <input value={audioTitle} onChange={(e) => setAudioTitle(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Transcript (SEO)">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={5}
                  placeholder="Plak hier het transcript van de aflevering..."
                  className={inputCls}
                />
                <span className="text-label-sm text-on-surface-variant">{transcript.length} tekens</span>
              </Field>
            </>
          )}
        </div>

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
