"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { BLOCK_LABELS, emptyBlock, newBlockId, type BlockType, type NewsletterBlock } from "@/lib/newsletter/blocks";
import { renderNewsletterHtml, type RenderBrand } from "@/lib/newsletter/render";
import { SALON_STATUSES, SUBSCRIBER_SOURCES, type Segment } from "@/lib/newsletter/segment";
import {
  aiFromBlogAction,
  aiRewriteAction,
  aiSubjectsAction,
  audienceCountAction,
  blogOptionsAction,
  cancelScheduleAction,
  saveCampaignAction,
  sendCampaignAction,
  sendTestAction,
  type CampaignDraft,
} from "@/lib/newsletter/actions";
import type { SubjectSuggestion } from "@/lib/newsletter/ai";

const SOURCE_LABELS: Record<(typeof SUBSCRIBER_SOURCES)[number], string> = {
  formulier: "Aanmeldformulier",
  klant: "Klanten",
  handmatig: "Handmatig",
  import: "Import",
};
const STATUS_LABELS: Record<(typeof SALON_STATUSES)[number], string> = {
  trial: "Proefperiode",
  active: "Actief",
  past_due: "Achterstallig",
  canceled: "Opgezegd",
};
const REWRITE_PRESETS = ["Maak korter en krachtiger", "Maak persoonlijker", "Maak zakelijker", "Verbeter spelling en zinsbouw"];
const ADDABLE: BlockType[] = ["heading", "text", "button", "image", "post", "divider", "spacer"];

/** Editor state: the save payload, with blocks/segment in their parsed (output) shape. */
type EditorDraft = Omit<CampaignDraft, "blocks" | "segment"> & { blocks: NewsletterBlock[]; segment: Segment };

interface Props {
  campaignId: string;
  status: string;
  scheduledAt: string | null;
  initial: EditorDraft;
  brands: Record<string, RenderBrand & { label: string }>;
  previewRecipient: { name: string | null; email: string };
}

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md outline-none focus:border-primary";
const smallBtn =
  "inline-flex items-center gap-[4px] rounded-full border border-outline-variant px-sm py-[4px] text-label-md font-label-md text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-50";
const primaryBtn =
  "inline-flex items-center gap-xs rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60";

export function CampaignEditor({ campaignId, status, scheduledAt, initial, brands, previewRecipient }: Props) {
  const [draft, setDraft] = useState<EditorDraft>(initial);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [audience, setAudience] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<SubjectSuggestion[]>([]);
  const [scheduleAt, setScheduleAt] = useState("");
  const editable = status === "draft" || status === "scheduled";
  const locked = status === "scheduled"; // content editable only after "terug naar concept"

  const update = useCallback(<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }, []);

  const setBlocks = useCallback((fn: (b: NewsletterBlock[]) => NewsletterBlock[]) => {
    setDraft((d) => ({ ...d, blocks: fn(d.blocks) }));
    setDirty(true);
  }, []);

  const save = useCallback(
    (then?: () => void) =>
      startTransition(async () => {
        const res = await saveCampaignAction(campaignId, draft);
        if (res.error) setNotice({ tone: "error", text: res.error });
        else {
          setDirty(false);
          setNotice({ tone: "ok", text: "Opgeslagen." });
          then?.();
        }
      }),
    [campaignId, draft],
  );

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editable && !locked) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, editable, locked]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  // Live audience count, debounced.
  const segmentKey = JSON.stringify(draft.segment);
  useEffect(() => {
    const t = setTimeout(() => {
      audienceCountAction(JSON.parse(segmentKey)).then(setAudience).catch(() => setAudience(null));
    }, 400);
    return () => clearTimeout(t);
  }, [segmentKey]);

  const brand = brands[draft.vertical] ?? Object.values(brands)[0]!;
  const previewHtml = useMemo(
    () =>
      renderNewsletterHtml(draft.blocks, {
        brand,
        subject: draft.subject || "(geen onderwerp)",
        previewText: draft.previewText,
        recipient: previewRecipient,
        unsubscribeUrl: "#afmelden",
      }),
    [draft.blocks, draft.subject, draft.previewText, brand, previewRecipient],
  );

  function run<T>(fn: () => Promise<T>, onDone: (r: T) => void) {
    startTransition(async () => {
      try {
        onDone(await fn());
      } catch (err) {
        setNotice({ tone: "error", text: err instanceof Error ? err.message : "Er ging iets mis." });
      }
    });
  }

  const onSend = () => {
    const when = scheduleAt ? new Date(scheduleAt) : null;
    const label = when ? `inplannen voor ${when.toLocaleString("nl-NL")}` : "nu verzenden";
    if (!window.confirm(`Nieuwsbrief ${label} naar ${audience ?? "?"} abonnees? Dit kan niet ongedaan worden gemaakt.`)) return;
    save(() =>
      run(
        () => sendCampaignAction(campaignId, when ? when.toISOString() : null),
        (r) => {
          setNotice(r.error ? { tone: "error", text: r.error } : { tone: "ok", text: r.message ?? "Verzonden." });
          if (!r.error) window.location.reload();
        },
      ),
    );
  };

  const disabled = !editable || locked || pending;

  return (
    <div className="flex flex-col gap-md">
      {/* Action bar */}
      <div className="sticky top-0 z-20 -mx-margin-mobile flex flex-wrap items-center gap-xs border-b border-outline-variant/40 bg-surface-container-lowest/95 px-margin-mobile py-sm backdrop-blur md:-mx-lg md:px-lg">
        <input
          aria-label="Naam van de campagne"
          value={draft.name}
          disabled={disabled}
          onChange={(e) => update("name", e.target.value)}
          className="min-w-[12rem] flex-1 rounded-lg border border-transparent bg-transparent px-xs py-[2px] font-headline-md text-headline-md text-on-surface outline-none hover:border-outline-variant focus:border-primary"
        />
        <span className="text-label-sm text-on-surface-variant">{pending ? "Bezig…" : dirty ? "Niet opgeslagen" : "Opgeslagen"}</span>
        {editable && !locked && (
          <>
            <button type="button" className={smallBtn} disabled={pending || !dirty} onClick={() => save()}>
              <Icon name="save" className="text-[16px]" /> Opslaan
            </button>
            <button
              type="button"
              className={smallBtn}
              disabled={pending}
              onClick={() => save(() => run(() => sendTestAction(campaignId), (r) => setNotice(r.error ? { tone: "error", text: r.error } : { tone: "ok", text: r.message! })))}
            >
              <Icon name="forward_to_inbox" className="text-[16px]" /> Testmail
            </button>
          </>
        )}
        {locked && (
          <button
            type="button"
            className={smallBtn}
            disabled={pending}
            onClick={() =>
              run(
                () => cancelScheduleAction(campaignId),
                (r) => {
                  setNotice(r.error ? { tone: "error", text: r.error } : { tone: "ok", text: r.message! });
                  if (!r.error) window.location.reload();
                },
              )
            }
          >
            <Icon name="edit_calendar" className="text-[16px]" /> Terug naar concept
          </button>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={cn("rounded-lg px-sm py-xs text-label-md", notice.tone === "ok" ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container")}
        >
          {notice.text}
        </div>
      )}
      {locked && scheduledAt && (
        <div className="rounded-lg bg-secondary-fixed/50 px-sm py-xs text-label-md text-on-surface">
          Ingepland voor {new Date(scheduledAt).toLocaleString("nl-NL")}. Zet hem terug naar concept om nog iets te wijzigen.
        </div>
      )}

      <div className="grid grid-cols-1 gap-md xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left: settings + content */}
        <div className="flex flex-col gap-md">
          <Section title="Onderwerp & afzender" icon="mail">
            <label className="flex flex-col gap-[4px] text-label-md text-on-surface-variant">
              Merk (afzender en huisstijl)
              <select className={inputCls} disabled={disabled} value={draft.vertical} onChange={(e) => update("vertical", e.target.value)}>
                {Object.entries(brands).map(([id, b]) => (
                  <option key={id} value={id}>
                    {b.name}.nl — {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-[4px] text-label-md text-on-surface-variant">
              <span className="flex justify-between">
                Onderwerpregel{draft.subjectB != null ? " (A)" : ""} <Counter value={draft.subject} max={55} />
              </span>
              <input className={inputCls} disabled={disabled} value={draft.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Waar gaat deze mail over?" />
            </label>
            {draft.subjectB != null && (
              <label className="flex flex-col gap-[4px] text-label-md text-on-surface-variant">
                <span className="flex justify-between">
                  Onderwerpregel (B) <Counter value={draft.subjectB ?? ""} max={55} />
                </span>
                <input className={inputCls} disabled={disabled} value={draft.subjectB ?? ""} onChange={(e) => update("subjectB", e.target.value)} placeholder="Alternatief voor de A/B-test" />
              </label>
            )}
            <label className="flex flex-col gap-[4px] text-label-md text-on-surface-variant">
              <span className="flex justify-between">
                Previewtekst <Counter value={draft.previewText ?? ""} max={90} />
              </span>
              <input
                className={inputCls}
                disabled={disabled}
                value={draft.previewText ?? ""}
                onChange={(e) => update("previewText", e.target.value)}
                placeholder="Het grijze regeltje naast het onderwerp in de inbox"
              />
            </label>
            <div className="flex flex-wrap gap-xs">
              <button
                type="button"
                className={smallBtn}
                disabled={disabled}
                onClick={() => update("subjectB", draft.subjectB == null ? "" : null)}
              >
                <Icon name="science" className="text-[16px]" /> {draft.subjectB == null ? "A/B-test onderwerp" : "A/B-test uit"}
              </button>
              <button
                type="button"
                className={smallBtn}
                disabled={disabled}
                onClick={() =>
                  run(
                    () => aiSubjectsAction(draft.blocks, draft.vertical),
                    (r) => (r.error ? setNotice({ tone: "error", text: r.error }) : setSuggestions(r.suggestions ?? [])),
                  )
                }
              >
                <Icon name="auto_awesome" className="text-[16px]" /> AI-suggesties
              </button>
            </div>
            {suggestions.length > 0 && (
              <ul className="flex flex-col gap-xs rounded-lg bg-surface-container-low p-sm">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-xs text-label-md">
                    <span>
                      <span className="text-on-surface">{s.subject}</span>
                      {s.previewText && <span className="block text-on-surface-variant">{s.previewText}</span>}
                    </span>
                    <span className="flex gap-[4px]">
                      <button
                        type="button"
                        className={smallBtn}
                        onClick={() => {
                          update("subject", s.subject);
                          if (s.previewText) update("previewText", s.previewText);
                        }}
                      >
                        Gebruik als A
                      </button>
                      <button type="button" className={smallBtn} onClick={() => update("subjectB", s.subject)}>
                        als B
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Doelgroep" icon="group" aside={<span className="text-label-md text-on-surface">{audience == null ? "…" : `${audience} ontvangers`}</span>}>
            <SegmentFilters segment={draft.segment} brands={brands} disabled={disabled} onChange={(s) => update("segment", s)} />
          </Section>

          <Section title="Inhoud" icon="view_agenda">
            <BlogImport
              vertical={draft.vertical}
              disabled={disabled}
              onBlocks={(blocks) => setBlocks((b) => [...b, ...blocks])}
              onError={(text) => setNotice({ tone: "error", text })}
            />
            {draft.blocks.length === 0 && <p className="text-body-md text-on-surface-variant">Nog geen blokken — voeg er hieronder een toe.</p>}
            {draft.blocks.map((block, i) => (
              <BlockCard
                key={block.id}
                block={block}
                disabled={disabled}
                first={i === 0}
                last={i === draft.blocks.length - 1}
                onChange={(nb) => setBlocks((b) => b.map((x) => (x.id === block.id ? nb : x)))}
                onMove={(dir) =>
                  setBlocks((b) => {
                    const next = [...b];
                    const j = i + dir;
                    [next[i], next[j]] = [next[j]!, next[i]!];
                    return next;
                  })
                }
                onDuplicate={() => setBlocks((b) => [...b.slice(0, i + 1), { ...block, id: newBlockId() }, ...b.slice(i + 1)])}
                onDelete={() => setBlocks((b) => b.filter((x) => x.id !== block.id))}
                onError={(text) => setNotice({ tone: "error", text })}
              />
            ))}
            {!disabled && (
              <div className="flex flex-wrap gap-xs border-t border-dashed border-outline-variant pt-sm">
                <span className="text-label-md text-on-surface-variant">Blok toevoegen:</span>
                {ADDABLE.map((t) => (
                  <button key={t} type="button" className={smallBtn} onClick={() => setBlocks((b) => [...b, emptyBlock(t)])}>
                    <Icon name={BLOCK_LABELS[t].icon} className="text-[16px]" /> {BLOCK_LABELS[t].label}
                  </button>
                ))}
              </div>
            )}
          </Section>

          {editable && !locked && (
            <Section title="Verzenden" icon="send">
              <label className="flex flex-col gap-[4px] text-label-md text-on-surface-variant">
                Inplannen (leeg = direct verzenden)
                <input type="datetime-local" className={inputCls} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              </label>
              <p className="text-label-md text-on-surface-variant">
                Tip: stuur eerst een testmail naar jezelf. Elke mail krijgt automatisch een afmeldlink en een one-click-afmeldheader.
              </p>
              <button type="button" className={cn(primaryBtn, "self-start")} disabled={pending || !audience} onClick={onSend}>
                <Icon name="send" className="text-[18px]" /> {scheduleAt ? "Inplannen" : "Nu verzenden"} naar {audience ?? "…"} abonnees
              </button>
            </Section>
          )}
        </div>

        {/* Right: live preview */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <div className="mb-xs flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Voorbeeld</h2>
            <div className="flex rounded-full border border-outline-variant p-[2px]" role="group" aria-label="Voorbeeldformaat">
              {(["desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={cn("rounded-full px-sm py-[2px] text-label-md", device === d ? "bg-primary text-on-primary" : "text-on-surface-variant")}
                >
                  <Icon name={d === "desktop" ? "desktop_windows" : "smartphone"} className="text-[16px]" />
                </button>
              ))}
            </div>
          </div>
          <InboxLine from={brand.name} subject={draft.subject} preview={draft.previewText} />
          <div className="flex justify-center rounded-xl border border-outline-variant/40 bg-surface-container-low p-xs">
            <iframe
              title="Voorbeeld van de nieuwsbrief"
              srcDoc={previewHtml}
              sandbox=""
              className="h-[70vh] rounded-lg bg-white transition-all"
              style={{ width: device === "desktop" ? "100%" : 375 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, aside, children }: { title: string; icon: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="flex items-center gap-xs font-headline-md text-headline-md text-on-surface">
          <Icon name={icon} className="text-[20px] text-primary" /> {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return <span className={cn("tabular-nums", over ? "text-error" : "text-on-surface-variant")}>{value.length}/{max}</span>;
}

function InboxLine({ from, subject, preview }: { from: string; subject: string; preview?: string | null }) {
  return (
    <div className="mb-xs rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-sm py-xs text-label-md">
      <span className="font-label-md text-on-surface">{from}</span>
      <span className="mx-xs text-on-surface-variant">·</span>
      <span className="text-on-surface">{subject || "(geen onderwerp)"}</span>
      {preview && <span className="text-on-surface-variant"> — {preview}</span>}
    </div>
  );
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function SegmentFilters({
  segment,
  brands,
  disabled,
  onChange,
}: {
  segment: Segment;
  brands: Record<string, { label: string }>;
  disabled: boolean;
  onChange: (s: Segment) => void;
}) {
  const [tagInput, setTagInput] = useState(segment.tags.join(", "));
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-sm py-[2px] text-label-md transition-colors disabled:opacity-50",
      active ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:border-primary",
    );
  return (
    <div className="flex flex-col gap-sm">
      <p className="text-label-md text-on-surface-variant">Niets aangevinkt = iedereen die is aangemeld. Afgemelde en gebouncete adressen krijgen nooit iets.</p>
      <FilterRow label="Bron">
        {SUBSCRIBER_SOURCES.map((s) => (
          <button key={s} type="button" disabled={disabled} className={chip(segment.sources.includes(s))} onClick={() => onChange({ ...segment, sources: toggle(segment.sources, s) })}>
            {SOURCE_LABELS[s]}
          </button>
        ))}
      </FilterRow>
      <FilterRow label="Vak">
        {Object.entries(brands).map(([id, b]) => (
          <button key={id} type="button" disabled={disabled} className={chip(segment.verticals.includes(id))} onClick={() => onChange({ ...segment, verticals: toggle(segment.verticals, id) })}>
            {b.label}
          </button>
        ))}
      </FilterRow>
      <FilterRow label="Klantstatus">
        {SALON_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            className={chip(segment.salonStatuses.includes(s))}
            onClick={() => onChange({ ...segment, salonStatuses: toggle(segment.salonStatuses, s) })}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </FilterRow>
      <label className="flex flex-col gap-[4px] text-label-md text-on-surface-variant">
        Tags (komma-gescheiden, één match is genoeg)
        <input
          className={inputCls}
          disabled={disabled}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onBlur={() => onChange({ ...segment, tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean) })}
        />
      </label>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-xs">
      <span className="w-24 text-label-md text-on-surface-variant">{label}</span>
      {children}
    </div>
  );
}

function BlogImport({
  vertical,
  disabled,
  onBlocks,
  onError,
}: {
  vertical: string;
  disabled: boolean;
  onBlocks: (b: NewsletterBlock[]) => void;
  onError: (t: string) => void;
}) {
  const [posts, setPosts] = useState<{ slug: string; title: string }[] | null>(null);
  const [slug, setSlug] = useState("");
  const [pending, start] = useTransition();
  const loaded = useRef<string | null>(null);

  const load = () => {
    if (loaded.current === vertical) return;
    loaded.current = vertical;
    blogOptionsAction(vertical).then(setPosts).catch(() => setPosts([]));
  };

  return (
    <div className="flex flex-wrap items-center gap-xs rounded-lg bg-surface-container-low p-sm">
      <Icon name="auto_awesome" className="text-[18px] text-primary" />
      <span className="text-label-md text-on-surface">Blog → nieuwsbrief</span>
      <select className={cn(inputCls, "w-auto min-w-[14rem] flex-1")} disabled={disabled} onFocus={load} onMouseDown={load} value={slug} onChange={(e) => setSlug(e.target.value)}>
        <option value="">{posts == null ? "Kies een gepubliceerd artikel…" : posts.length ? "Kies een artikel…" : "Geen gepubliceerde artikelen"}</option>
        {posts?.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={smallBtn}
        disabled={disabled || !slug || pending}
        onClick={() =>
          start(async () => {
            const r = await aiFromBlogAction(slug, vertical);
            if (r.error) onError(r.error);
            else onBlocks(r.blocks ?? []);
          })
        }
      >
        {pending ? "Schrijven…" : "Toevoegen met AI-intro"}
      </button>
    </div>
  );
}

function BlockCard({
  block,
  disabled,
  first,
  last,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  onError,
}: {
  block: NewsletterBlock;
  disabled: boolean;
  first: boolean;
  last: boolean;
  onChange: (b: NewsletterBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onError: (t: string) => void;
}) {
  const meta = BLOCK_LABELS[block.type];
  const iconBtn = "rounded-full p-[4px] text-on-surface-variant hover:bg-surface-container-high hover:text-primary disabled:opacity-30";
  return (
    <div className="rounded-lg border border-outline-variant/60 p-sm">
      <div className="mb-xs flex items-center gap-xs">
        <Icon name={meta.icon} className="text-[18px] text-on-surface-variant" />
        <span className="flex-1 text-label-md font-label-md text-on-surface">{meta.label}</span>
        {!disabled && (
          <>
            <button type="button" aria-label="Omhoog" className={iconBtn} disabled={first} onClick={() => onMove(-1)}>
              <Icon name="arrow_upward" className="text-[16px]" />
            </button>
            <button type="button" aria-label="Omlaag" className={iconBtn} disabled={last} onClick={() => onMove(1)}>
              <Icon name="arrow_downward" className="text-[16px]" />
            </button>
            <button type="button" aria-label="Dupliceren" className={iconBtn} onClick={onDuplicate}>
              <Icon name="content_copy" className="text-[16px]" />
            </button>
            <button type="button" aria-label="Verwijderen" className={iconBtn} onClick={onDelete}>
              <Icon name="delete" className="text-[16px]" />
            </button>
          </>
        )}
      </div>
      <BlockFields block={block} disabled={disabled} onChange={onChange} onError={onError} />
    </div>
  );
}

function BlockFields({
  block,
  disabled,
  onChange,
  onError,
}: {
  block: NewsletterBlock;
  disabled: boolean;
  onChange: (b: NewsletterBlock) => void;
  onError: (t: string) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-xs">
          <input className={inputCls} disabled={disabled} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          <select className={cn(inputCls, "w-auto")} disabled={disabled} value={block.level} onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 })}>
            <option value={1}>Groot</option>
            <option value={2}>Normaal</option>
          </select>
        </div>
      );
    case "text":
      return <TextBlockFields block={block} disabled={disabled} onChange={onChange} onError={onError} />;
    case "button":
      return (
        <div className="grid grid-cols-1 gap-xs sm:grid-cols-[1fr_1.5fr_auto]">
          <input className={inputCls} disabled={disabled} value={block.label} placeholder="Knoptekst" onChange={(e) => onChange({ ...block, label: e.target.value })} />
          <input className={inputCls} disabled={disabled} value={block.url} placeholder="https://…" onChange={(e) => onChange({ ...block, url: e.target.value })} />
          <select className={inputCls} disabled={disabled} value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value as "left" | "center" })}>
            <option value="left">Links</option>
            <option value="center">Midden</option>
          </select>
        </div>
      );
    case "image":
      return <ImageFields block={block} disabled={disabled} onChange={onChange} onError={onError} />;
    case "post":
      return (
        <div className="grid grid-cols-1 gap-xs">
          <input className={inputCls} disabled={disabled} value={block.title} placeholder="Titel" onChange={(e) => onChange({ ...block, title: e.target.value })} />
          <textarea className={inputCls} rows={2} disabled={disabled} value={block.excerpt} placeholder="Korte samenvatting" onChange={(e) => onChange({ ...block, excerpt: e.target.value })} />
          <input className={inputCls} disabled={disabled} value={block.url} placeholder="Link naar het artikel" onChange={(e) => onChange({ ...block, url: e.target.value })} />
          <input className={inputCls} disabled={disabled} value={block.image ?? ""} placeholder="Afbeelding-URL (optioneel)" onChange={(e) => onChange({ ...block, image: e.target.value })} />
        </div>
      );
    case "spacer":
      return (
        <select className={cn(inputCls, "w-auto")} disabled={disabled} value={block.size} onChange={(e) => onChange({ ...block, size: e.target.value as "s" | "m" | "l" })}>
          <option value="s">Klein</option>
          <option value="m">Middel</option>
          <option value="l">Groot</option>
        </select>
      );
    case "divider":
      return null;
  }
}

function TextBlockFields({
  block,
  disabled,
  onChange,
  onError,
}: {
  block: Extract<NewsletterBlock, { type: "text" }>;
  disabled: boolean;
  onChange: (b: NewsletterBlock) => void;
  onError: (t: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, start] = useTransition();

  const wrap = (before: string, after = before, placeholder = "tekst") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || placeholder;
    onChange({ ...block, markdown: value.slice(0, s) + before + selected + after + value.slice(e) });
  };
  const tool = "rounded p-[4px] text-on-surface-variant hover:bg-surface-container-high hover:text-primary";

  return (
    <div className="flex flex-col gap-xs">
      {!disabled && (
        <div className="flex flex-wrap items-center gap-[2px]">
          <button type="button" className={tool} aria-label="Vet" onClick={() => wrap("**")}>
            <Icon name="format_bold" className="text-[18px]" />
          </button>
          <button type="button" className={tool} aria-label="Cursief" onClick={() => wrap("*")}>
            <Icon name="format_italic" className="text-[18px]" />
          </button>
          <button
            type="button"
            className={tool}
            aria-label="Link"
            onClick={() => {
              const url = window.prompt("Link (https://… of /pad):");
              if (url) wrap("[", `](${url})`, "linktekst");
            }}
          >
            <Icon name="link" className="text-[18px]" />
          </button>
          <button type="button" className={tool} aria-label="Opsomming" onClick={() => wrap("\n- ", "", "punt")}>
            <Icon name="format_list_bulleted" className="text-[18px]" />
          </button>
          <button type="button" className={tool} aria-label="Voornaam invoegen" onClick={() => wrap("{{voornaam|daar}}", "", "")}>
            <Icon name="person" className="text-[18px]" />
          </button>
          <span className="mx-xs h-4 w-px bg-outline-variant" aria-hidden />
          <select
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-xs py-[2px] text-label-md"
            value=""
            disabled={pending}
            onChange={(e) => {
              const instruction = e.target.value;
              if (!instruction) return;
              start(async () => {
                const r = await aiRewriteAction(block.markdown, instruction);
                if (r.error) onError(r.error);
                else onChange({ ...block, markdown: r.markdown! });
              });
            }}
          >
            <option value="">{pending ? "AI schrijft…" : "✦ AI herschrijven…"}</option>
            {REWRITE_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}
      <textarea
        ref={ref}
        className={cn(inputCls, "font-mono text-label-md")}
        rows={Math.min(14, Math.max(4, block.markdown.split("\n").length + 1))}
        disabled={disabled || pending}
        value={block.markdown}
        onChange={(e) => onChange({ ...block, markdown: e.target.value })}
      />
    </div>
  );
}

function ImageFields({
  block,
  disabled,
  onChange,
  onError,
}: {
  block: Extract<NewsletterBlock, { type: "image" }>;
  disabled: boolean;
  onChange: (b: NewsletterBlock) => void;
  onError: (t: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload mislukt");
      onChange({ ...block, src: json.url });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="grid grid-cols-1 gap-xs">
      <div className="flex gap-xs">
        <input className={inputCls} disabled={disabled} value={block.src} placeholder="Afbeelding-URL" onChange={(e) => onChange({ ...block, src: e.target.value })} />
        {!disabled && (
          <label className={cn(smallBtn, "cursor-pointer whitespace-nowrap")}>
            <Icon name="upload" className="text-[16px]" /> {uploading ? "Uploaden…" : "Upload"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        )}
      </div>
      <input className={inputCls} disabled={disabled} value={block.alt} placeholder="Alt-tekst (verplicht voor toegankelijkheid)" onChange={(e) => onChange({ ...block, alt: e.target.value })} />
      <input className={inputCls} disabled={disabled} value={block.href ?? ""} placeholder="Link bij klikken (optioneel)" onChange={(e) => onChange({ ...block, href: e.target.value })} />
    </div>
  );
}
