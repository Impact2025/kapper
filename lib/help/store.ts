import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { helpArticles } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { captureError } from "@/lib/observability";
import { HELP_ARTICLES, type HelpArticle } from "@/lib/help/articles";
import { mergeArticles, publishedOnly, type HelpOverrideRow, type ManagedArticle } from "@/lib/help/merge";

const TTL_MS = 60_000;
let cache: { at: number; all: ManagedArticle[] } | null = null;

async function loadRows(): Promise<HelpOverrideRow[]> {
  if (!env.DATABASE_URL) return [];
  try {
    return await db.select().from(helpArticles);
  } catch (err) {
    // Table missing / DB down: the code-defined articles keep the help center alive.
    captureError("help/store", err);
    return [];
  }
}

/** Every article incl. hidden ones and their source — for the admin editor. */
export async function getManagedArticles(opts: { fresh?: boolean } = {}): Promise<ManagedArticle[]> {
  if (!opts.fresh && cache && Date.now() - cache.at < TTL_MS) return cache.all;
  const all = mergeArticles(HELP_ARTICLES, await loadRows());
  cache = { at: Date.now(), all };
  return all;
}

/** Published corpus used by pages, search and the support chat. */
export async function getHelpCorpus(): Promise<HelpArticle[]> {
  return publishedOnly(await getManagedArticles());
}

export async function getPublishedArticle(slug: string): Promise<HelpArticle | undefined> {
  return (await getHelpCorpus()).find((a) => a.slug === slug);
}

export function invalidateHelpCache(): void {
  cache = null;
}

export async function saveArticle(row: HelpOverrideRow, userId: string): Promise<void> {
  await db
    .insert(helpArticles)
    .values({ ...row, updatedBy: userId })
    .onConflictDoUpdate({ target: helpArticles.slug, set: { ...row, updatedBy: userId } });
  invalidateHelpCache();
}

/** Drops the override: a default article returns to its code version, an extra one is deleted. */
export async function resetArticle(slug: string): Promise<void> {
  await db.delete(helpArticles).where(eq(helpArticles.slug, slug));
  invalidateHelpCache();
}
