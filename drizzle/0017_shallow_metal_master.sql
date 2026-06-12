ALTER TABLE "discovery_job" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "heartbeatAt" timestamp;