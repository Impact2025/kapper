import { getKnowledgePost } from "@/lib/kennisbank/queries";
import { renderOgCard, OG_SIZE } from "@/lib/og/card";
import { getVerticalConfig } from "@/lib/verticals";

export const alt = "Kennisbank";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ vertical: string; slug: string }> }) {
  const { vertical, slug } = await params;
  const pack = getVerticalConfig(vertical);
  const post = await getKnowledgePost(slug, pack.id);

  return renderOgCard({
    eyebrow: `Kennisbank · ${pack.brand.name}.nl`,
    title: post?.title ?? `${pack.brand.name}.nl`,
    brand: { name: `${pack.brand.name}.nl`, tagline: pack.brand.tagline },
  });
}
