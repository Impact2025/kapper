"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { generateBlogPost } from "@/lib/blog/generate";
import { computeSeo } from "@/lib/blog/seo";
import { slugTaken } from "@/lib/blog/queries";
import { slugify } from "@/lib/utils";
import { publicEnv } from "@/lib/env";

export interface PostActionState {
  ok?: boolean;
  error?: string;
}

/** Generate a draft with AI, persist it, and redirect to the editor. */
export async function generateDraft(
  _prev: PostActionState | undefined,
  formData: FormData,
): Promise<PostActionState> {
  const author = await getCurrentUser();
  const topic = String(formData.get("topic") ?? "").trim();
  if (topic.length < 4) return { error: "Geef een onderwerp van minimaal 4 tekens op." };

  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  let draft;
  try {
    draft = await generateBlogPost(topic, keywords);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Generatie mislukt." };
  }

  // Ensure a unique slug.
  let slug = draft.slug;
  let i = 2;
  while (await slugTaken(slug)) slug = `${draft.slug}-${i++}`;

  const [row] = await db
    .insert(blogPosts)
    .values({
      title: draft.title,
      slug,
      status: "draft",
      excerpt: draft.excerpt,
      bodyMdx: draft.bodyMdx,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      keywords: draft.keywords,
      jsonLd: draft.jsonLd,
      seoScore: draft.seoScore,
      authorId: author.id,
    })
    .returning({ id: blogPosts.id });

  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${row.id}`);
}

/** Create an empty draft and jump straight into the full editor. */
export async function createBlankDraft(): Promise<never> {
  const author = await getCurrentUser();

  let slug = "nieuw-artikel";
  let i = 2;
  while (await slugTaken(slug)) slug = `nieuw-artikel-${i++}`;

  const [row] = await db
    .insert(blogPosts)
    .values({
      title: "Nieuw artikel",
      slug,
      status: "draft",
      bodyMdx: "",
      keywords: [],
      authorId: author.id,
    })
    .returning({ id: blogPosts.id });

  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${row.id}`);
}

const saveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, "Titel is te kort.").max(120),
  slug: z.string().min(3).max(160),
  excerpt: z.string().max(300).optional().or(z.literal("")),
  metaTitle: z.string().max(70).optional().or(z.literal("")),
  metaDescription: z.string().max(170).optional().or(z.literal("")),
  keywords: z.string().optional().or(z.literal("")),
  bodyMdx: z.string().min(1, "Body mag niet leeg zijn."),
  coverImage: z.string().optional().or(z.literal("")),
  coverImageAlt: z.string().max(200).optional().or(z.literal("")),
  audioUrl: z.string().optional().or(z.literal("")),
  audioTitle: z.string().max(160).optional().or(z.literal("")),
  audioDurationSeconds: z.string().optional().or(z.literal("")),
  transcript: z.string().optional().or(z.literal("")),
});

export async function savePost(
  _prev: PostActionState | undefined,
  formData: FormData,
): Promise<PostActionState> {
  await getCurrentUser();
  const parsed = saveSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    keywords: formData.get("keywords"),
    bodyMdx: formData.get("bodyMdx"),
    coverImage: formData.get("coverImage"),
    coverImageAlt: formData.get("coverImageAlt"),
    audioUrl: formData.get("audioUrl"),
    audioTitle: formData.get("audioTitle"),
    audioDurationSeconds: formData.get("audioDurationSeconds"),
    transcript: formData.get("transcript"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }
  const d = parsed.data;

  const slug = slugify(d.slug) || slugify(d.title);
  if (await slugTaken(slug, d.id)) {
    return { error: "Deze slug is al in gebruik door een ander artikel." };
  }

  const keywords = (d.keywords ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const { score } = computeSeo({
    title: d.title,
    metaTitle: d.metaTitle || d.title,
    metaDescription: d.metaDescription || "",
    bodyMdx: d.bodyMdx,
    keywords,
    slug,
  });

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: d.title,
    description: d.metaDescription || d.excerpt || "",
    keywords: keywords.join(", "),
    inLanguage: "nl-NL",
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
  };

  await db
    .update(blogPosts)
    .set({
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
      keywords,
      bodyMdx: d.bodyMdx,
      seoScore: score,
      jsonLd,
      coverImage: d.coverImage || null,
      coverImageAlt: d.coverImageAlt || null,
      audioUrl: d.audioUrl || null,
      audioTitle: d.audioTitle || null,
      audioDurationSeconds: d.audioDurationSeconds ? Number(d.audioDurationSeconds) || null : null,
      transcript: d.transcript || null,
    })
    .where(eq(blogPosts.id, d.id));

  revalidatePath(`/admin/blog/${d.id}`);
  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog");
  return { ok: true };
}

export async function setPostStatus(id: string, status: "draft" | "published"): Promise<void> {
  await getCurrentUser();
  await db
    .update(blogPosts)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : null,
    })
    .where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/blog");
}

export async function deletePost(id: string): Promise<void> {
  await getCurrentUser();
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
