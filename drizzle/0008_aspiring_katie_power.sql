ALTER TABLE "discovery_job" ALTER COLUMN "status" SET DEFAULT 'queued';--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "suggestedKeywords" jsonb;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "lastDiscoveryKeywords" jsonb;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "totalFound" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "insertedLeads" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "duplicateLeads" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "completedQueries" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "currentQuery" text;--> statement-breakpoint
ALTER TABLE "discovery_job" ADD COLUMN "startedAt" timestamp;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "websiteDomain" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "googlePlaceId" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "googleMapsUrl" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "googleRating" real;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "googleReviewCount" integer;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "lat" real;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "lng" real;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "priceRange" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "photoUrl" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "emails" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "phones" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "socialMedia" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "instagramHandle" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "facebookUrl" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "services" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "ownerName" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "teamMembers" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "operatingHours" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "yearEstablished" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "pricingInfo" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "amenities" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "aiSummary" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "websiteContent" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "enrichmentSources" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "score" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "scoreBreakdown" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "firecrawlEnriched" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "discoveryQuery" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "discoveryQueries" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "status" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_job" DROP COLUMN "leadsFound";--> statement-breakpoint
ALTER TABLE "discovery_job" DROP COLUMN "totalProcessed";--> statement-breakpoint
ALTER TABLE "lead" DROP COLUMN "socialLinks";--> statement-breakpoint
ALTER TABLE "lead" DROP COLUMN "sourceUrl";--> statement-breakpoint
ALTER TABLE "lead" DROP COLUMN "relevanceScore";--> statement-breakpoint
ALTER TABLE "lead" DROP COLUMN "scoreExplanation";