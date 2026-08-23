CREATE TABLE "whatsapp_test_message" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"connectionId" text NOT NULL,
	"templateId" text,
	"sentByUserId" text,
	"recipientPhone" text NOT NULL,
	"templateName" text NOT NULL,
	"templateLanguage" text NOT NULL,
	"templateParameters" jsonb NOT NULL,
	"renderedBody" text NOT NULL,
	"consentConfirmedAt" timestamp NOT NULL,
	"status" text DEFAULT 'sending' NOT NULL,
	"metaMessageId" text,
	"acceptedAt" timestamp,
	"failedAt" timestamp,
	"errorCode" text,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_test_message" ADD CONSTRAINT "whatsapp_test_message_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_test_message" ADD CONSTRAINT "whatsapp_test_message_connectionId_whatsapp_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_test_message" ADD CONSTRAINT "whatsapp_test_message_templateId_whatsapp_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."whatsapp_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_test_message" ADD CONSTRAINT "whatsapp_test_message_sentByUserId_user_id_fk" FOREIGN KEY ("sentByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_test_message_business_created_idx" ON "whatsapp_test_message" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_test_message_meta_uidx" ON "whatsapp_test_message" USING btree ("metaMessageId");