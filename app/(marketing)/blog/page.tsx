import { BlogIndexView, blogIndexMeta } from "@/components/marketing/pages/content-pages";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const metadata = blogIndexMeta(KAPPER_VERTICAL);

export const revalidate = 3600;

export default function BlogIndexPage() {
  return <BlogIndexView pack={KAPPER_VERTICAL} />;
}
