CREATE INDEX "discovery_job_status_idx" ON "discovery_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "discovery_job_user_idx" ON "discovery_job" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "discovery_job_business_idx" ON "discovery_job" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "lead_business_idx" ON "lead" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "lead_job_idx" ON "lead" USING btree ("jobId");