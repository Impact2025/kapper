import { listVerticals } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import type { RenderBrand } from "@/lib/newsletter/render";

/** Brand chrome per vertical for the editor preview (mirrors brandFor in lib/mail/templates.ts). */
export function editorBrands(): Record<string, RenderBrand & { label: string }> {
  return Object.fromEntries(
    listVerticals().map((p) => [p.id, { name: p.brand.name, domain: p.brand.domain, siteUrl: siteUrlFor(p.id), label: p.label }]),
  );
}
