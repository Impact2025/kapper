CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid,
	"feature" text NOT NULL,
	"kind" text DEFAULT 'llm' NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"voice_seconds" integer DEFAULT 0 NOT NULL,
	"cost_micro_eur" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon_daily_stats" (
	"salon_id" uuid NOT NULL,
	"day" date NOT NULL,
	"conversations" integer DEFAULT 0 NOT NULL,
	"calls_handled" integer DEFAULT 0 NOT NULL,
	"voice_seconds" integer DEFAULT 0 NOT NULL,
	"bookings" integer DEFAULT 0 NOT NULL,
	"escalations" integer DEFAULT 0 NOT NULL,
	"ai_calls" integer DEFAULT 0 NOT NULL,
	"ai_input_tokens" integer DEFAULT 0 NOT NULL,
	"ai_output_tokens" integer DEFAULT 0 NOT NULL,
	"ai_cost_micro_eur" integer DEFAULT 0 NOT NULL,
	"tickets_opened" integer DEFAULT 0 NOT NULL,
	"logins" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salon_daily_stats_salon_id_day_pk" PRIMARY KEY("salon_id","day")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_daily_stats" ADD CONSTRAINT "salon_daily_stats_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_target_idx" ON "admin_audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "ai_usage_salon_created_idx" ON "ai_usage" USING btree ("salon_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_created_idx" ON "ai_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "salon_daily_stats_day_idx" ON "salon_daily_stats" USING btree ("day");