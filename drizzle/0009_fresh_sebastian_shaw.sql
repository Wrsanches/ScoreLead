CREATE TABLE "saved_search" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"state" text,
	"city" text,
	"location" text NOT NULL,
	"keywords" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "brandColors" jsonb;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "brandFonts" jsonb;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "brandStyle" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "googleReviews" jsonb;--> statement-breakpoint
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;