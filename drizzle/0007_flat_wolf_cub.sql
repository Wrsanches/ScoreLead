CREATE TABLE "discovery_job" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"state" text,
	"city" text,
	"location" text NOT NULL,
	"keywords" text NOT NULL,
	"maxResults" integer NOT NULL,
	"serviceArea" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"leadsFound" integer DEFAULT 0 NOT NULL,
	"totalProcessed" integer DEFAULT 0 NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"businessId" text NOT NULL,
	"name" text,
	"website" text,
	"email" text,
	"phone" text,
	"address" text,
	"description" text,
	"socialLinks" text,
	"source" text NOT NULL,
	"sourceUrl" text,
	"relevanceScore" integer,
	"scoreExplanation" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discovery_job" ADD CONSTRAINT "discovery_job_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD CONSTRAINT "discovery_job_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_jobId_discovery_job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."discovery_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;