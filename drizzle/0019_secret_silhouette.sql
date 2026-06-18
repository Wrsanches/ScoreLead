ALTER TABLE "discovery_job" ADD COLUMN "runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "searchDepth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "exhausted" boolean DEFAULT false NOT NULL;