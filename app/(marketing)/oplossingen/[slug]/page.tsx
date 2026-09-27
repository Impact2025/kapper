import type { Metadata } from "next";
import { SolutionPageView, solutionMeta, solutionSlugs } from "@/components/marketing/pages/solution-page";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const dynamicParams = false;

export function generateStaticParams() {
  return solutionSlugs(KAPPER_VERTICAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return solutionMeta(KAPPER_VERTICAL, slug);
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SolutionPageView pack={KAPPER_VERTICAL} slug={slug} />;
}
