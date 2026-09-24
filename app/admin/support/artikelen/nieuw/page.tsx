import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { ArticleEditor } from "@/components/support/article-editor";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ titel?: string }> }) {
  await requireRole("admin");
  const { titel } = await searchParams;
  const title = titel?.slice(0, 160) ?? "";

  return (
    <div>
      <Link href="/admin/support/artikelen" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Artikelen
      </Link>
      <PageHeader title="Nieuw artikel" subtitle="Schrijf het antwoord zoals je het aan een salon-eigenaar zou uitleggen." />
      <ArticleEditor
        slugLocked={false}
        initial={{
          slug: slugify(title),
          title: title ? (title.endsWith("?") ? title : `${title}?`) : "",
          category: "aan-de-slag",
          summary: "",
          body: "",
          keywords: title,
          related: "",
          audience: "both",
          hidden: false,
        }}
      />
    </div>
  );
}
