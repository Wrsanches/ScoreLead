CREATE TABLE "content_plan_job" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"userId" text NOT NULL,
	"month" text NOT NULL,
	"postCount" integer,
	"replaceExisting" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"insertedPosts" integer DEFAULT 0 NOT NULL,
	"postIds" jsonb,
	"errorMessage" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"heartbeatAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "content_plan_job" ADD CONSTRAINT "content_plan_job_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plan_job" ADD CONSTRAINT "content_plan_job_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_plan_job_status_idx" ON "content_plan_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_plan_job_user_idx" ON "content_plan_job" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "content_plan_job_business_month_idx" ON "content_plan_job" USING btree ("businessId","month");--> statement-breakpoint
CREATE UNIQUE INDEX "content_plan_job_active_uidx" ON "content_plan_job" USING btree ("businessId","month") WHERE "content_plan_job"."status" IN ('queued', 'running');