import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { PageHeader, Card } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { GenerateForm } from "@/components/admin/blog/generate-form";
import { env } from "@/lib/env";

export default async function NewBlogPostPage() {
  await getCurrentUser();
  const aiAvailable = !!env.ANTHROPIC_API_KEY;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/blog"
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" /> Terug naar blog
      </Link>

      <PageHeader title="Nieuw artikel" subtitle="Laat AI een SEO-concept schrijven, jij verfijnt het." />

      {!aiAvailable && (
        <div className="mb-md rounded-lg bg-secondary-fixed px-sm py-sm text-label-md text-on-secondary-fixed">
          Let op: ANTHROPIC_API_KEY ontbreekt. Stel deze in om AI-generatie te gebruiken.
        </div>
      )}

      <Card>
        <GenerateForm />
      </Card>
    </div>
  );
}
