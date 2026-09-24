import type { Metadata } from "next";
import { KennisbankIndexView, kennisbankIndexMeta } from "@/components/marketing/pages/content-pages";
import { getVerticalConfig } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  return kennisbankIndexMeta(getVerticalConfig(vertical));
}

export default async function VerticalKennisbankIndex({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  return <KennisbankIndexView pack={getVerticalConfig(vertical)} />;
}
