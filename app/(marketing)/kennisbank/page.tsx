import { KennisbankIndexView, kennisbankIndexMeta } from "@/components/marketing/pages/content-pages";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const metadata = kennisbankIndexMeta(KAPPER_VERTICAL);

export const revalidate = 3600;

export default function KennisbankIndexPage() {
  return <KennisbankIndexView pack={KAPPER_VERTICAL} />;
}
