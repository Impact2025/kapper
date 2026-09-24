import type { Metadata } from "next";
import { listPublishedSlugs } from "@/lib/blog/queries";
import { BlogPostView, blogPostMeta } from "@/components/marketing/pages/content-pages";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, listLiveVerticals } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateStaticParams() {
  const out: { vertical: string; slug: string }[] = [];
  for (const v of listLiveVerticals().filter((x) => x.id !== DEFAULT_VERTICAL_ID)) {
    const slugs = await listPublishedSlugs(v.id);
    out.push(...slugs.map((s) => ({ vertical: v.id, slug: s.slug })));
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string; slug: string }> }): Promise<Metadata> {
  const { vertical, slug } = await params;
  return blogPostMeta(getVerticalConfig(vertical), slug);
}

export default async function VerticalBlogPost({ params }: { params: Promise<{ vertical: string; slug: string }> }) {
  const { vertical, slug } = await params;
  return <BlogPostView pack={getVerticalConfig(vertical)} slug={slug} />;
}
