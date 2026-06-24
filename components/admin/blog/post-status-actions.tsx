"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPostStatus, deletePost } from "@/lib/blog/actions";
import { Icon } from "@/components/ui/icon";

export function PostStatusActions({
  id,
  status,
  slug,
}: {
  id: string;
  status: "draft" | "review" | "published";
  slug: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isPublished = status === "published";

  return (
    <div className="flex flex-wrap items-center gap-sm">
      {isPublished && (
        <a
          href={`/blog/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-base rounded-full border-2 border-primary px-md py-xs text-label-md font-label-md text-primary transition-all hover:bg-primary/5"
        >
          <Icon name="open_in_new" className="text-[18px]" /> Bekijk live
        </a>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await setPostStatus(id, isPublished ? "draft" : "published");
            router.refresh();
          })
        }
        className="inline-flex items-center gap-base rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
      >
        <Icon name={isPublished ? "unpublished" : "publish"} className="text-[18px]" />
        {isPublished ? "Depubliceren" : "Publiceren"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Dit artikel definitief verwijderen?")) {
            start(async () => {
              await deletePost(id);
            });
          }
        }}
        className="inline-flex items-center gap-base rounded-full px-md py-xs text-label-md font-label-md text-error transition-colors hover:bg-error-container disabled:opacity-60"
      >
        <Icon name="delete" className="text-[18px]" /> Verwijderen
      </button>
    </div>
  );
}
