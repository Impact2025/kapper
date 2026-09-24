"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { HELP_CATEGORIES } from "@/lib/help/articles";
import { SLUG_RE } from "@/lib/help/merge";
import { resetArticle, saveArticle } from "@/lib/help/store";

const schema = z.object({
  slug: z.string().trim().toLowerCase().min(3).max(100).regex(SLUG_RE, "Gebruik kleine letters, cijfers en streepjes."),
  title: z.string().trim().min(5).max(160),
  category: z.string().refine((c) => HELP_CATEGORIES.some((x) => x.id === c), "Onbekende categorie."),
  summary: z.string().trim().min(10).max(400),
  body: z.string().trim().min(20).max(20_000),
  keywords: z.string().max(500).default(""),
  related: z.string().max(500).default(""),
  audience: z.enum(["both", "prospect", "salon"]),
  hidden: z.boolean(),
});

export interface SaveArticleState {
  error?: string;
}

function splitList(s: string): string[] {
  return s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function refresh(slug: string) {
  revalidatePath("/help", "layout");
  revalidatePath("/faq");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/help/${slug}`);
  revalidatePath("/admin/support/artikelen");
}

export async function saveArticleAction(_prev: SaveArticleState, formData: FormData): Promise<SaveArticleState> {
  const admin = await requireRole("admin");
  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    category: formData.get("category"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    keywords: formData.get("keywords") ?? "",
    related: formData.get("related") ?? "",
    audience: formData.get("audience") ?? "both",
    hidden: formData.get("hidden") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };

  const d = parsed.data;
  await saveArticle(
    {
      slug: d.slug,
      title: d.title,
      category: d.category,
      summary: d.summary,
      body: d.body,
      keywords: splitList(d.keywords),
      related: splitList(d.related).filter((s) => SLUG_RE.test(s) && s !== d.slug),
      audience: d.audience,
      hidden: d.hidden,
    },
    admin.id,
  );
  refresh(d.slug);
  redirect("/admin/support/artikelen?opgeslagen=1");
}

export async function resetArticleAction(slug: string): Promise<void> {
  await requireRole("admin");
  await resetArticle(slug);
  refresh(slug);
  redirect("/admin/support/artikelen");
}
