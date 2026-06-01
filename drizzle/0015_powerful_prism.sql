CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"referenceId" text NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"status" text NOT NULL,
	"periodStart" timestamp,
	"periodEnd" timestamp,
	"cancelAtPeriodEnd" boolean,
	"cancelAt" timestamp,
	"canceledAt" timestamp,
	"endedAt" timestamp,
	"seats" integer,
	"trialStart" timestamp,
	"trialEnd" timestamp,
	"billingInterval" text,
	"stripeScheduleId" text
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"userId" text PRIMARY KEY NOT NULL,
	"discoveryJobs" integer DEFAULT 0 NOT NULL,
	"outreachMessages" integer DEFAULT 0 NOT NULL,
	"contentPlans" integer DEFAULT 0 NOT NULL,
	"aiImages" integer DEFAULT 0 NOT NULL,
	"aiImagesMonth" integer DEFAULT 0 NOT NULL,
	"aiImagesMonthKey" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripeCustomerId" text;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;