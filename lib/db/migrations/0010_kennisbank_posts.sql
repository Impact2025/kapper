CREATE TABLE "knowledge_posts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "status" "post_status" DEFAULT 'draft'::post_status NOT NULL,
  "excerpt" TEXT,
  "body_mdx" TEXT DEFAULT '' NOT NULL,
  "body_is_html" BOOLEAN DEFAULT false NOT NULL,
  "meta_title" VARCHAR(70),
  "meta_description" VARCHAR(170),
  "keywords" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "internal_links" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "external_links" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "json_ld" JSONB,
  "seo_score" INTEGER DEFAULT 0 NOT NULL,
  "cover_image" TEXT,
  "cover_image_alt" TEXT,
  "category" TEXT,
  "author_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "published_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "knowledge_status_idx" ON "knowledge_posts"("status");
CREATE INDEX "knowledge_category_idx" ON "knowledge_posts"("category");
