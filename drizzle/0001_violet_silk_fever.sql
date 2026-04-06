CREATE TABLE "business" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"website" text,
	"instagram" text,
	"facebook" text,
	"linkedin" text,
	"location" text,
	"name" text,
	"description" text,
	"persona" text,
	"clientPersona" text,
	"field" text,
	"category" text,
	"tags" text,
	"onboardingCompleted" boolean DEFAULT false NOT NULL,
	"onboardingStep" text DEFAULT 'links' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;