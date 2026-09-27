import { getKnowledgePost } from "@/lib/kennisbank/queries";
import { renderOgCard, OG_SIZE } from "@/lib/og/card";

export const alt = "KapperAssistent.nl kennisbank";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getKnowledgePost(slug);

  return renderOgCard({
    eyebrow: "Kennisbank · KapperAssistent.nl",
    title: post?.title ?? "KapperAssistent.nl",
  });
}
