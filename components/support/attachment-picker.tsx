"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

export interface UploadedAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

const MAX_FILES = 3;

export function AttachmentPicker({
  value,
  onChange,
}: {
  value: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/support/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Uploaden mislukt.");
      } else {
        onChange([...value, data as UploadedAttachment]);
      }
    } catch {
      setError("Uploaden mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-xs">
        {value.map((a) => (
          <span
            key={a.url}
            className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-sm py-[2px] text-label-sm text-on-surface"
          >
            <Icon name={a.type === "application/pdf" ? "picture_as_pdf" : "image"} className="text-[16px]" />
            <span className="max-w-[10rem] truncate">{a.name}</span>
            <button
              type="button"
              aria-label={`Verwijder ${a.name}`}
              onClick={() => onChange(value.filter((x) => x.url !== a.url))}
              className="text-on-surface-variant hover:text-error"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </span>
        ))}
        {value.length < MAX_FILES && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-xs rounded-full border border-dashed border-outline px-sm py-[2px] text-label-sm text-on-surface-variant hover:bg-primary/5 disabled:opacity-60"
          >
            <Icon name="attach_file" className="text-[16px]" />
            {busy ? "Uploaden…" : "Bijlage toevoegen"}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onPick} />
      <p className="mt-xs text-label-sm text-on-surface-variant">JPG, PNG, WebP of PDF, max 5 MB, maximaal {MAX_FILES} bijlagen.</p>
      {error && <p className="mt-xs text-label-sm text-error">{error}</p>}
    </div>
  );
}
