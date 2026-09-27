import type { Metadata } from "next";
import { KennisbankIndexView, kennisbankCategoryMeta } from "@/components/marketing/pages/content-pages";
import { listCategories } from "@/lib/kennisbank/queries";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cats = await listCategories(KAPPER_VERTICAL.id).catch(() => []);
  return cats.map((cat) => ({ cat }));
}

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat } = await params;
  return kennisbankCategoryMeta(KAPPER_VERTICAL, cat);
}

export default async function KennisbankCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;
  return <KennisbankIndexView pack={KAPPER_VERTICAL} category={cat} />;
}
