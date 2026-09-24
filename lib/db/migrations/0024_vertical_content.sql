ALTER TABLE "blog_posts" ADD COLUMN "vertical" text DEFAULT 'kapper' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_posts" ADD COLUMN "vertical" text DEFAULT 'kapper' NOT NULL;--> statement-breakpoint
CREATE INDEX "blog_vertical_idx" ON "blog_posts" USING btree ("vertical","status");--> statement-breakpoint
CREATE INDEX "knowledge_vertical_idx" ON "knowledge_posts" USING btree ("vertical","status");