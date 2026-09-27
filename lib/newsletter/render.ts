import { renderMarkdown } from "@/lib/blog/markdown";
import type { NewsletterBlock } from "@/lib/newsletter/blocks";

/**
 * Pure newsletter → email renderer. Table-free single column with inline
 * styles only (what Gmail/Outlook reliably keep), max 600px, images fluid.
 * Every outgoing http(s) link is passed through `trackUrl` so clicks are
 * attributable; the unsubscribe link is never tracked or rewritten.
 */

export interface RenderBrand {
  name: string;
  domain: string;
  siteUrl: string;
}

export interface RenderRecipient {
  name?: string | null;
  email: string;
}

export interface RenderOptions {
  brand: RenderBrand;
  subject: string;
  previewText?: string | null;
  recipient: RenderRecipient;
  unsubscribeUrl: string;
  /** Wrap an absolute URL for click tracking; identity when omitted (preview/test). */
  trackUrl?: (url: string) => string;
  /** 1×1 open-tracking pixel; omitted in preview. */
  openPixelUrl?: string | null;
}

const BRAND = "#526350";
const CREAM = "#fbf9f8";
const INK = "#1b1c1c";
const MUTED = "#5f635d";
const FONT = "'Hanken Grotesk',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'EB Garamond',serif";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** "Jan de Vries" → "Jan"; used for {{voornaam}}. */
export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/**
 * Replace {{voornaam}}, {{naam}}, {{email}} — with an optional fallback:
 * {{voornaam|daar}}. Values are HTML-escaped when `html` is true.
 */
export function personalize(text: string, r: RenderRecipient, html: boolean): string {
  const values: Record<string, string> = {
    voornaam: firstName(r.name),
    naam: (r.name ?? "").trim(),
    email: r.email,
  };
  return text.replace(/\{\{\s*(voornaam|naam|email)\s*(?:\|\s*([^}]*?)\s*)?\}\}/g, (_m, key: string, fallback?: string) => {
    const v = values[key] || fallback || "";
    return html ? esc(v) : v;
  });
}

function absolute(url: string, siteUrl: string): string {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return siteUrl.replace(/\/$/, "") + url;
  return url;
}

/** Inline email styles onto the tags renderMarkdown emits. */
function styleMarkdownHtml(html: string): string {
  return html
    .replace(/<p>/g, `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">`)
    .replace(/<h2>/g, `<h2 style="font-family:${SERIF};font-size:22px;line-height:1.3;margin:24px 0 12px;color:${INK};">`)
    .replace(/<h3>/g, `<h3 style="font-family:${SERIF};font-size:19px;line-height:1.3;margin:20px 0 10px;color:${INK};">`)
    .replace(/<h4>/g, `<h4 style="font-size:16px;margin:16px 0 8px;color:${INK};">`)
    .replace(/<ul>/g, `<ul style="margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.6;color:${INK};">`)
    .replace(/<ol>/g, `<ol style="margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.6;color:${INK};">`)
    .replace(/<a href=/g, `<a style="color:${BRAND};text-decoration:underline;" href=`)
    .replace(/<hr>/g, `<hr style="border:none;border-top:1px solid #e3e3df;margin:24px 0;">`);
}

function trackHrefs(html: string, opts: RenderOptions): string {
  return html.replace(/href="([^"]+)"/g, (_m, href: string) => {
    const decoded = href.replace(/&amp;/g, "&");
    const abs = absolute(decoded, opts.brand.siteUrl);
    const tracked = /^https?:\/\//.test(abs) && opts.trackUrl ? opts.trackUrl(abs) : abs;
    return `href="${esc(tracked)}"`;
  });
}

function link(url: string, opts: RenderOptions): string {
  const abs = absolute(url, opts.brand.siteUrl);
  return esc(opts.trackUrl && /^https?:\/\//.test(abs) ? opts.trackUrl(abs) : abs);
}

function renderBlock(b: NewsletterBlock, opts: RenderOptions): string {
  const p = (s: string) => personalize(esc(s), opts.recipient, true);
  switch (b.type) {
    case "heading":
      return b.level === 1
        ? `<h1 style="font-family:${SERIF};font-size:28px;line-height:1.25;margin:0 0 16px;color:${INK};">${p(b.text)}</h1>`
        : `<h2 style="font-family:${SERIF};font-size:22px;line-height:1.3;margin:8px 0 12px;color:${INK};">${p(b.text)}</h2>`;
    case "text": {
      // Personalize before markdown so {{…}} inside **bold** etc. still works; the
      // markdown renderer escapes the substituted values.
      const md = personalize(b.markdown, opts.recipient, false);
      return trackHrefs(styleMarkdownHtml(renderMarkdown(md)), opts);
    }
    case "button":
      return `<div style="margin:8px 0 24px;text-align:${b.align};"><a href="${link(b.url, opts)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:15px;font-family:${FONT};">${p(b.label)}</a></div>`;
    case "image": {
      const img = `<img src="${esc(absolute(b.src, opts.brand.siteUrl))}" alt="${esc(b.alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:12px;">`;
      return `<div style="margin:0 0 20px;">${b.href ? `<a href="${link(b.href, opts)}">${img}</a>` : img}</div>`;
    }
    case "post": {
      const href = link(b.url, opts);
      const img = b.image
        ? `<a href="${href}"><img src="${esc(absolute(b.image, opts.brand.siteUrl))}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:12px 12px 0 0;"></a>`
        : "";
      return `<div style="margin:0 0 20px;border:1px solid #e3e3df;border-radius:12px;overflow:hidden;">${img}<div style="padding:16px 20px;">
<a href="${href}" style="font-family:${SERIF};font-size:20px;line-height:1.3;color:${INK};text-decoration:none;">${esc(b.title)}</a>
${b.excerpt ? `<p style="margin:8px 0 12px;font-size:15px;line-height:1.55;color:${MUTED};">${esc(b.excerpt)}</p>` : ""}
<a href="${href}" style="font-size:14px;font-weight:600;color:${BRAND};text-decoration:none;">Lees verder →</a></div></div>`;
    }
    case "divider":
      return `<hr style="border:none;border-top:1px solid #e3e3df;margin:24px 0;">`;
    case "spacer":
      return `<div style="height:${{ s: 8, m: 24, l: 48 }[b.size]}px;line-height:0;font-size:0;">&nbsp;</div>`;
  }
}

export function renderNewsletterHtml(blocks: NewsletterBlock[], opts: RenderOptions): string {
  const body = blocks.map((b) => renderBlock(b, opts)).join("\n");
  const preview = opts.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(personalize(opts.previewText, opts.recipient, false))}${"&nbsp;&zwnj;".repeat(40)}</div>`
    : "";
  const pixel = opts.openPixelUrl ? `<img src="${esc(opts.openPixelUrl)}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;">` : "";
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.subject)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:${FONT};color:${INK};">
${preview}
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="font-size:22px;font-weight:700;color:${BRAND};margin-bottom:24px;font-family:${FONT};">${esc(opts.brand.name)}.nl</div>
  <div style="background:#ffffff;border-radius:16px;padding:32px 32px 16px;">
${body}
  </div>
  <p style="font-size:12px;line-height:1.6;color:#747871;text-align:center;margin-top:24px;">
    Je ontvangt deze mail van ${esc(opts.brand.name)}.nl op ${esc(opts.recipient.email)}.<br>
    <a href="${esc(opts.unsubscribeUrl)}" style="color:${BRAND};">Afmelden</a> · <a href="${esc(opts.brand.siteUrl)}" style="color:${BRAND};">${esc(opts.brand.domain)}</a>
  </p>
</div>
${pixel}
</body></html>`;
}

/** Plain-text alternative — improves deliverability and accessibility. */
export function renderNewsletterText(blocks: NewsletterBlock[], opts: Pick<RenderOptions, "brand" | "recipient" | "unsubscribeUrl">): string {
  const lines: string[] = [];
  for (const b of blocks) {
    const p = (s: string) => personalize(s, opts.recipient, false);
    switch (b.type) {
      case "heading":
        lines.push(p(b.text).toUpperCase(), "");
        break;
      case "text":
        lines.push(p(b.markdown).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => `${t} (${absolute(u, opts.brand.siteUrl)})`), "");
        break;
      case "button":
        lines.push(`${p(b.label)}: ${absolute(b.url, opts.brand.siteUrl)}`, "");
        break;
      case "image":
        if (b.href) lines.push(`${b.alt}: ${absolute(b.href, opts.brand.siteUrl)}`, "");
        break;
      case "post":
        lines.push(b.title, b.excerpt, absolute(b.url, opts.brand.siteUrl), "");
        break;
      case "divider":
        lines.push("———", "");
        break;
      case "spacer":
        break;
    }
  }
  lines.push("--", `${opts.brand.name}.nl — afmelden: ${opts.unsubscribeUrl}`);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
