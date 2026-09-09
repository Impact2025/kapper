import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { createBlankDraft } from "@/lib/blog/actions";
import { PageHeader, Card } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { GenerateForm } from "@/components/admin/blog/generate-form";
import { env } from "@/lib/env";

export default async function NewBlogPostPage() {
  await getCurrentUser();
  const aiAvailable = !!env.OPENMODEL_API_KEY;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/blog"
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" /> Terug naar blog
      </Link>

      <PageHeader title="Nieuw artikel" subtitle="Laat AI een SEO-concept schrijven, of begin direct zelf te schrijven." />

      {!aiAvailable && (
        <div className="mb-md rounded-lg bg-secondary-fixed px-sm py-sm text-label-md text-on-secondary-fixed">
          Let op: OPENMODEL_API_KEY ontbreekt. Stel deze in om AI-generatie te gebruiken.
        </div>
      )}

      <Card>
        <GenerateForm />
      </Card>

      <div className="my-md flex items-center gap-sm text-label-sm text-on-surface-variant">
        <div className="h-px flex-1 bg-outline-variant/40" />
        of
        <div className="h-px flex-1 bg-outline-variant/40" />
      </div>

      <form action={createBlankDraft}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-label-md text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="edit_note" className="text-[18px]" />
          Begin met een leeg artikel in de volledige editor
        </button>
      </form>
    </div>
  );
}
