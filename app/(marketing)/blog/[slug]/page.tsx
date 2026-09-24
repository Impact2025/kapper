import type { Metadata } from "next";
import { listPublishedSlugs } from "@/lib/blog/queries";
import { BlogPostView, blogPostMeta } from "@/components/marketing/pages/content-pages";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs(KAPPER_VERTICAL.id);
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return blogPostMeta(KAPPER_VERTICAL, slug);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostView pack={KAPPER_VERTICAL} slug={slug} />;
}
