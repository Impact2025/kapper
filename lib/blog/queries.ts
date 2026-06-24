import "server-only";
import { desc, eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "review" | "published";
  seoScore: number;
  publishedAt: Date | null;
  createdAt: Date;
}

export async function listPosts(): Promise<PostListItem[]> {
  if (!env.DATABASE_URL) return [];
  return db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      status: blogPosts.status,
      seoScore: blogPosts.seoScore,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));
}

export async function getPostById(id: string) {
  if (!env.DATABASE_URL) return null;
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return row ?? null;
}

export async function getPublishedPost(slug: string) {
  if (!env.DATABASE_URL) return null;
  const [row] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return row ?? null;
}

export async function listPublishedSlugs(): Promise<{ slug: string; publishedAt: Date | null }[]> {
  if (!env.DATABASE_URL) return [];
  return db
    .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));
}

/** True if a slug is already taken by a different post. */
export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  if (!env.DATABASE_URL) return false;
  const rows = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(
      exceptId
        ? and(eq(blogPosts.slug, slug), ne(blogPosts.id, exceptId))
        : eq(blogPosts.slug, slug),
    )
    .limit(1);
  return rows.length > 0;
}
