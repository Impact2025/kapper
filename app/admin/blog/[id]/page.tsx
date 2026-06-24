import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getPostById } from "@/lib/blog/queries";
import { PageHeader, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { PostEditor } from "@/components/admin/blog/post-editor";
import { PostStatusActions } from "@/components/admin/blog/post-status-actions";

const STATUS_TONE = { draft: "neutral", review: "warning", published: "success" } as const;
const STATUS_LABEL = { draft: "Concept", review: "Review", published: "Live" } as const;

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getCurrentUser();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" /> Terug naar blog
      </Link>

      <PageHeader
        title="Artikel bewerken"
        subtitle={post.title}
        action={
          <div className="flex flex-col items-end gap-sm">
            <Badge tone={STATUS_TONE[post.status]}>{STATUS_LABEL[post.status]}</Badge>
            <PostStatusActions id={post.id} status={post.status} slug={post.slug} />
          </div>
        }
      />

      <PostEditor
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          keywords: post.keywords,
          bodyMdx: post.bodyMdx,
        }}
      />
    </div>
  );
}
