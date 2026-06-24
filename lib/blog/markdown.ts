/**
 * Minimal, dependency-free Markdown → HTML renderer for blog bodies.
 * Supports: #/##/### headings, paragraphs, unordered/ordered lists,
 * **bold**, *italic*, `code`, [links](url), and horizontal rules.
 * All text is HTML-escaped first, so stored content cannot inject markup.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  let out = escapeHtml(s);
  // links [text](http...) — only http(s) and relative paths allowed
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    (_m, text, href) => `<a href="${href}" rel="noopener">${text}</a>`,
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let para: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushPara() {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  }
  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      closeList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      closeList();
      const level = heading[1].length + 1; // h1 reserved for page title → start at h2
      const tag = `h${Math.min(level, 6)}`;
      html.push(`<${tag}>${inline(heading[2])}</${tag}>`);
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(line.trim())) {
      flushPara();
      closeList();
      html.push("<hr>");
      continue;
    }

    const ul = /^[-*]\s+(.*)$/.exec(line.trim());
    const ol = /^\d+\.\s+(.*)$/.exec(line.trim());
    if (ul || ol) {
      flushPara();
      const wanted = ul ? "ul" : "ol";
      if (listType !== wanted) {
        closeList();
        listType = wanted;
        html.push(`<${wanted}>`);
      }
      html.push(`<li>${inline((ul ? ul[1] : ol![1]))}</li>`);
      continue;
    }

    closeList();
    para.push(line.trim());
  }
  flushPara();
  closeList();
  return html.join("\n");
}

/** Strip markdown to plain text (for excerpts / reading time). */
export function stripMarkdown(md: string): string {
  return md
    .replace(/[#>*_`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTimeMinutes(md: string): number {
  const words = stripMarkdown(md).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
