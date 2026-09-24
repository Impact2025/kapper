import type { Metadata } from "next";
import { BlogIndexView, blogIndexMeta } from "@/components/marketing/pages/content-pages";
import { getVerticalConfig } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  return blogIndexMeta(getVerticalConfig(vertical));
}

export default async function VerticalBlogIndex({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  return <BlogIndexView pack={getVerticalConfig(vertical)} />;
}
