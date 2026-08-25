ALTER TABLE "usage" ADD COLUMN "discoveryJobsMonth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "discoveryJobsMonthKey" text;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "outreachMessagesMonth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "outreachMessagesMonthKey" text;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "contentPlansMonth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "contentPlansMonthKey" text;