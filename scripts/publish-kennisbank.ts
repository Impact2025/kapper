/**
 * Publishes the markdown articles of a content folder to the kennisbank
 * (/api/kennisbank/publish) or the blog (--type blog → /api/publish) — the same
 * ingest routes AgentOS uses. A `date:` in the frontmatter becomes publishedAt.
 *
 *   pnpm tsx scripts/publish-kennisbank.ts content/kennisbank-kapper            # dry run
 *   pnpm tsx scripts/publish-kennisbank.ts content/kennisbank-kapper --send \
 *        --base https://www.kappersassistent.nl [--vertical kapper] [--type blog]
 *
 * Needs PUBLISH_API_KEY in the environment for --send. Without --send nothing
 * leaves this machine: the script only prints what it would post.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArticle } from "../lib/blog/frontmatter";
import { renderMarkdown } from "../lib/blog/markdown";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--base" && args[args.indexOf(a) - 1] !== "--vertical" && args[args.indexOf(a) - 1] !== "--type");
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const send = args.includes("--send");
const base = flag("--base");
const vertical = flag("--vertical") ?? "kapper";
const type = flag("--type") === "blog" ? "blog" : "kennisbank";

if (!dir) throw new Error("usage: publish-kennisbank.ts <folder> [--send --base <url>] [--vertical <id>]");
if (send && (!base || !process.env.PUBLISH_API_KEY)) throw new Error("--send needs --base <url> and PUBLISH_API_KEY");

async function main(dir: string) {
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
  const a = parseArticle(readFileSync(join(dir, file), "utf8"));
  // The page renders the title as its own h1, so the body's leading "# Title" is dropped.
  const html = renderMarkdown(a.body.replace(/^#\s+.*\n+/, ""));
  const payload = {
    title: a.title,
    content: html,
    slug: a.slug,
    seoTitle: a.metaTitle,
    seoDescription: a.metaDescription,
    excerpt: a.metaDescription,
    tags: a.keywords,
    category: a.category,
    vertical,
    ...(a.date ? { publishedAt: a.date } : {}),
    source: "publish-kennisbank-script",
  };

  if (!send) {
    console.log(`[dry-run] ${type}:${vertical}/${a.slug} (${a.category || "-"}) ${a.date} — ${html.length} chars html, ${a.keywords.length} keywords`);
    continue;
  }
  const res = await fetch(`${base}${type === "blog" ? "/api/publish" : "/api/kennisbank/publish"}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.PUBLISH_API_KEY}` },
    body: JSON.stringify(payload),
  });
  console.log(`${res.status} ${a.slug} ${await res.text()}`);
}
}

main(dir).catch((e) => {
  console.error(e);
  process.exit(1);
});
