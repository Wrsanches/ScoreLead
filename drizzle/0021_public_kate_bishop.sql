ALTER TABLE "lead" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "employeeCount" integer;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "revenueRange" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "techStack" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "decisionMakers" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "emailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "apolloEnrichments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "apolloEnrichmentsMonth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "apolloEnrichmentsMonthKey" text;