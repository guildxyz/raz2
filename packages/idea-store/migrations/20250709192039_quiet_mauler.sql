CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50) DEFAULT 'strategy' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"user_id" varchar(100) NOT NULL,
	"chat_id" integer,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"message" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "ideas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_id_idx" ON "ideas" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "category_idx" ON "ideas" USING btree ("category");--> statement-breakpoint
CREATE INDEX "status_idx" ON "ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "ideas" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "embedding_idx" ON "ideas" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "idea_id_idx" ON "reminders" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "scheduled_for_idx" ON "reminders" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "is_active_idx" ON "reminders" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "is_sent_idx" ON "reminders" USING btree ("is_sent");