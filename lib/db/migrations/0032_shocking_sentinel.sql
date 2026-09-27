ALTER TABLE "leads" ADD COLUMN "vertical" text DEFAULT 'kapper' NOT NULL;--> statement-breakpoint
CREATE INDEX "leads_vertical_idx" ON "leads" USING btree ("vertical");