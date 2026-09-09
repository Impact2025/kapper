import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { env } from "@/lib/env";

function isAuthorized(req: Request): boolean {
  if (!env.PUBLISH_API_KEY) return false;
  return req.headers.get("authorization") === `Bearer ${env.PUBLISH_API_KEY}`;
}

/** AgentOS unpublish: sets the post back to draft, never a hard delete. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.update(blogPosts).set({ status: "draft" }).where(eq(blogPosts.id, existing.id));

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ success: true, slug });
}
