import type { Metadata } from "next";
import { listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { KennisbankPostView, kennisbankPostMeta } from "@/components/marketing/pages/content-pages";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedKnowledgeSlugs(KAPPER_VERTICAL.id);
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return kennisbankPostMeta(KAPPER_VERTICAL, slug);
}

export default async function KennisbankPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <KennisbankPostView pack={KAPPER_VERTICAL} slug={slug} />;
}
