import { getPublishedPost } from "@/lib/blog/queries";
import { renderOgCard, OG_SIZE } from "@/lib/og/card";

export const alt = "KapperAssistent.nl blog";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  return renderOgCard({
    eyebrow: "Blog · KapperAssistent.nl",
    title: post?.title ?? "KapperAssistent.nl",
  });
}
