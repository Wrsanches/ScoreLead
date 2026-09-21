CREATE TABLE "email_component" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"kind" text NOT NULL,
	"props" jsonb NOT NULL,
	"updatedByUserId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_template" ALTER COLUMN "bodyMode" SET DEFAULT 'blocks';--> statement-breakpoint
ALTER TABLE "email_component" ADD CONSTRAINT "email_component_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_component" ADD CONSTRAINT "email_component_updatedByUserId_user_id_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_component_business_kind_uidx" ON "email_component" USING btree ("businessId","kind");
--> statement-breakpoint
UPDATE "email_template" SET "bodyMode" = 'html', "bodyDoc" = NULL WHERE "bodyMode" = 'rich';
