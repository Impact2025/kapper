-- Add + backfill in one guarded block, so a re-run (or a DB where db:push
-- already created the column) never overwrites real edit times.
-- Existing articles were last touched when they were published (or created as
-- a draft), not today; a scheduled future published_at is capped at now().
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'blog_posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "blog_posts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
    UPDATE "blog_posts" SET "updated_at" = LEAST(COALESCE("published_at", "created_at"), now());
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'knowledge_posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "knowledge_posts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
    UPDATE "knowledge_posts" SET "updated_at" = LEAST(COALESCE("published_at", "created_at"), now());
  END IF;
END $$;
