import type { Metadata } from "next";
import { SolutionPageView, solutionMeta, solutionSlugs } from "@/components/marketing/pages/solution-page";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, listVerticals } from "@/lib/verticals";

export function generateStaticParams() {
  return listVerticals()
    .filter((v) => v.id !== DEFAULT_VERTICAL_ID)
    .flatMap((v) => solutionSlugs(v).map((slug) => ({ vertical: v.id, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string; slug: string }> }): Promise<Metadata> {
  const { vertical, slug } = await params;
  return solutionMeta(getVerticalConfig(vertical), slug);
}

export default async function VerticalSolutionPage({ params }: { params: Promise<{ vertical: string; slug: string }> }) {
  const { vertical, slug } = await params;
  return <SolutionPageView pack={getVerticalConfig(vertical)} slug={slug} />;
}
