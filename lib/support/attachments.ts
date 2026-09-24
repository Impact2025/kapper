/** Bijlagen bij tickets: alleen veilige types en alleen uit onze eigen Blob-opslag. */
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export function isAllowedAttachmentType(type: string): boolean {
  return (ATTACHMENT_TYPES as readonly string[]).includes(type);
}

/** Only https URLs on Vercel Blob's public host — never arbitrary links smuggled in the body. */
export function isAllowedAttachmentUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Strip path tricks and odd characters from a user-supplied file name. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "bijlage";
  const cleaned = base.replace(/[^\w.\- ]+/g, "_").replace(/\.{2,}/g, ".").trim().slice(0, 80);
  return cleaned || "bijlage";
}
