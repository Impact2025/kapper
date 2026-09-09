import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, users } from "@/lib/db/schema";
import { env, publicEnv } from "@/lib/env";
import { stripHtml } from "@/lib/blog/markdown";
import { slugify } from "@/lib/utils";

/**
 * Ingest endpoint for AgentOS' content pipeline (backend/domains/publish/
 * content_pipeline.py — `_publish_to_project_site`). AgentOS never publishes
 * anything without a human "Goedkeuren & publiceren" click on its end, so a
 * request reaching this route already represents approved content — same
 * trust boundary as the existing /admin editor, gated by a shared secret
 * instead of a session cookie.
 *
 * Contract (fixed by the AgentOS side, not renegotiable per-project):
 *   POST body: { title, content (HTML fragment), slug, seoTitle,
 *                seoDescription, excerpt, tags: string[], source }
 *   Response: 200/201 { url }
 */

function isAuthorized(req: Request): boolean {
  if (!env.PUBLISH_API_KEY) return false;
  return req.headers.get("authorization") === `Bearer ${env.PUBLISH_API_KEY}`;
}

interface PublishPayload {
  title?: string;
  content?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
  tags?: string[];
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PublishPayload | null;
  if (!body?.title || !body?.content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const slug = slugify(body.slug || body.title);
  const keywords = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];
  const metaTitle = (body.seoTitle || body.title).slice(0, 70);
  const metaDescription = (body.seoDescription || body.excerpt || "").slice(0, 170);
  const plain = stripHtml(body.content);
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const headingCount = (body.content.match(/<h[23][ >]/gi) ?? []).length;
  const seoScore = [
    metaTitle.length >= 30 && metaTitle.length <= 60,
    metaDescription.length >= 70 && metaDescription.length <= 160,
    wordCount >= 600,
    headingCount >= 2,
    keywords.length >= 1,
  ].reduce((sum, ok, i) => sum + (ok ? [15, 15, 30, 20, 20][i] : 0), 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: body.title,
    description: metaDescription,
    keywords: keywords.join(", "),
    inLanguage: "nl-NL",
    author: { "@type": "Person", name: "Vincent van Munster" },
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
  };

  const [author] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "v.munster@weareimpact.nl"))
    .limit(1);

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (existing) {
    await db
      .update(blogPosts)
      .set({
        title: body.title,
        status: "published",
        excerpt: body.excerpt || null,
        bodyMdx: body.content,
        bodyIsHtml: true,
        metaTitle,
        metaDescription,
        keywords,
        jsonLd,
        seoScore,
      })
      .where(eq(blogPosts.id, existing.id));
  } else {
    await db.insert(blogPosts).values({
      title: body.title,
      slug,
      status: "published",
      excerpt: body.excerpt || null,
      bodyMdx: body.content,
      bodyIsHtml: true,
      metaTitle,
      metaDescription,
      keywords,
      jsonLd,
      seoScore,
      authorId: author?.id,
      publishedAt: new Date(),
    });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);

  return NextResponse.json(
    { url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${slug}` },
    { status: existing ? 200 : 201 },
  );
}
