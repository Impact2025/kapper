import type { Metadata } from "next";
import { listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { KennisbankPostView, kennisbankPostMeta } from "@/components/marketing/pages/content-pages";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, listLiveVerticals } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateStaticParams() {
  const out: { vertical: string; slug: string }[] = [];
  for (const v of listLiveVerticals().filter((x) => x.id !== DEFAULT_VERTICAL_ID)) {
    const slugs = await listPublishedKnowledgeSlugs(v.id);
    out.push(...slugs.map((s) => ({ vertical: v.id, slug: s.slug })));
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string; slug: string }> }): Promise<Metadata> {
  const { vertical, slug } = await params;
  return kennisbankPostMeta(getVerticalConfig(vertical), slug);
}

export default async function VerticalKennisbankPost({ params }: { params: Promise<{ vertical: string; slug: string }> }) {
  const { vertical, slug } = await params;
  return <KennisbankPostView pack={getVerticalConfig(vertical)} slug={slug} />;
}
