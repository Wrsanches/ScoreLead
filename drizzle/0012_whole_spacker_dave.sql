CREATE TABLE "content_post" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"businessId" text NOT NULL,
	"provider" text DEFAULT 'instagram' NOT NULL,
	"scheduledFor" timestamp NOT NULL,
	"postType" text DEFAULT 'single' NOT NULL,
	"pillar" text,
	"caption" text DEFAULT '' NOT NULL,
	"hashtags" jsonb DEFAULT '[]'::jsonb,
	"visualIdea" text,
	"callToAction" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"aiGenerated" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_post" ADD CONSTRAINT "content_post_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_post" ADD CONSTRAINT "content_post_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;