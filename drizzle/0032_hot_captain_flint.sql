CREATE INDEX "business_user_idx" ON "business" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "discovery_job_business_created_idx" ON "discovery_job" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "lead_business_created_idx" ON "lead" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "subscription_reference_status_idx" ON "subscription" USING btree ("referenceId","status");