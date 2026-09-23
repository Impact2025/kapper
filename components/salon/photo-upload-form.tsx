"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { addPhotoAction } from "@/lib/dossier/actions";
import { Icon } from "@/components/ui/icon";

export function PhotoUploadForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(addPhotoAction, undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Clear the staged photo once a submit succeeds — adjusted during render
  // (React's documented alternative to an effect for "respond to a prop/
  // state change") rather than in a useEffect, so there's no extra render
  // pass or setState-during-effect.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setBlobUrl(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/salon/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload mislukt.");
      setBlobUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-sm">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="blobUrl" value={blobUrl ?? ""} />

      {blobUrl ? (
        <div className="flex items-center gap-sm">
          <Image src={blobUrl} alt="Voorbeeld" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => {
              setBlobUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-label-sm text-on-surface-variant hover:text-error"
          >
            Andere foto kiezen
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-sm rounded-lg border border-dashed border-outline-variant px-sm py-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary">
          <Icon name={uploading ? "refresh" : "add_a_photo"} className={`text-[18px] ${uploading ? "animate-spin" : ""}`} />
          {uploading ? "Uploaden…" : "Foto kiezen (max 5MB)"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
      {uploadError && <p className="text-label-sm text-error">{uploadError}</p>}

      <div className="flex items-center gap-md">
        <select name="type" defaultValue="before" className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface">
          <option value="before">Voor</option>
          <option value="after">Na</option>
        </select>
        <label className="flex cursor-pointer items-center gap-xs text-label-sm text-on-surface-variant">
          <input type="checkbox" name="portfolioConsentConfirmed" value="true" className="h-4 w-4 rounded border-outline-variant accent-primary" />
          Toestemming voor gebruik op website/social media
        </label>
      </div>

      <div className="flex items-center gap-md">
        <button
          type="submit"
          disabled={!blobUrl || pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Icon name={pending ? "refresh" : "add"} className={`text-[18px] ${pending ? "animate-spin" : ""}`} />
          Foto toevoegen
        </button>
        {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
      </div>
    </form>
  );
}
