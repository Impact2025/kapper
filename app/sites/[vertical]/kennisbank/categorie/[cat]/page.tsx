import type { Metadata } from "next";
import { KennisbankIndexView, kennisbankCategoryMeta } from "@/components/marketing/pages/content-pages";
import { getVerticalConfig } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ vertical: string; cat: string }> }): Promise<Metadata> {
  const { vertical, cat } = await params;
  return kennisbankCategoryMeta(getVerticalConfig(vertical), cat);
}

export default async function VerticalKennisbankCategory({ params }: { params: Promise<{ vertical: string; cat: string }> }) {
  const { vertical, cat } = await params;
  return <KennisbankIndexView pack={getVerticalConfig(vertical)} category={cat} />;
}
