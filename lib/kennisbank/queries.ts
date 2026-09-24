import "server-only";
import { desc, eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgePosts } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { DEFAULT_VERTICAL_ID } from "@/lib/verticals";

export interface KnowledgePostListItem {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "review" | "published";
  seoScore: number;
  publishedAt: Date | null;
  createdAt: Date;
  category: string | null;
}

export async function listKnowledgePosts(): Promise<KnowledgePostListItem[]> {
  if (!env.DATABASE_URL) return [];
  return db
    .select({
      id: knowledgePosts.id,
      title: knowledgePosts.title,
      slug: knowledgePosts.slug,
      status: knowledgePosts.status,
      seoScore: knowledgePosts.seoScore,
      publishedAt: knowledgePosts.publishedAt,
      createdAt: knowledgePosts.createdAt,
      category: knowledgePosts.category,
    })
    .from(knowledgePosts)
    .orderBy(desc(knowledgePosts.createdAt));
}

export async function getKnowledgePost(slug: string, vertical: string = DEFAULT_VERTICAL_ID) {
  if (!env.DATABASE_URL) return null;
  const [row] = await db
    .select()
    .from(knowledgePosts)
    .where(
      and(eq(knowledgePosts.slug, slug), eq(knowledgePosts.status, "published"), eq(knowledgePosts.vertical, vertical)),
    )
    .limit(1);
  return row ?? null;
}

export async function getKnowledgePostById(id: string) {
  if (!env.DATABASE_URL) return null;
  const [row] = await db.select().from(knowledgePosts).where(eq(knowledgePosts.id, id)).limit(1);
  return row ?? null;
}

export async function listPublishedKnowledgeSlugs(
  vertical: string = DEFAULT_VERTICAL_ID,
): Promise<{ slug: string; publishedAt: Date | null }[]> {
  if (!env.DATABASE_URL) return [];
  return db
    .select({ slug: knowledgePosts.slug, publishedAt: knowledgePosts.publishedAt })
    .from(knowledgePosts)
    .where(and(eq(knowledgePosts.status, "published"), eq(knowledgePosts.vertical, vertical)))
    .orderBy(desc(knowledgePosts.publishedAt));
}

export async function listCategories(vertical: string = DEFAULT_VERTICAL_ID): Promise<string[]> {
  if (!env.DATABASE_URL) return [];
  const rows = await db
    .selectDistinct({ category: knowledgePosts.category })
    .from(knowledgePosts)
    .where(and(eq(knowledgePosts.status, "published"), eq(knowledgePosts.vertical, vertical)));
  return rows.map((r) => r.category).filter((c): c is string => c != null);
}

/** True if a slug is already taken by a different kennisbank post. */
export async function knowledgeSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  if (!env.DATABASE_URL) return false;
  const rows = await db
    .select({ id: knowledgePosts.id })
    .from(knowledgePosts)
    .where(exceptId ? and(eq(knowledgePosts.slug, slug), ne(knowledgePosts.id, exceptId)) : eq(knowledgePosts.slug, slug))
    .limit(1);
  return rows.length > 0;
}
