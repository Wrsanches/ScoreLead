CREATE TABLE "email_message" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"leadId" text NOT NULL,
	"connectionId" text NOT NULL,
	"templateId" text,
	"sentByUserId" text,
	"toEmail" text NOT NULL,
	"fromEmail" text NOT NULL,
	"replyTo" text,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"text" text,
	"status" text DEFAULT 'sending' NOT NULL,
	"resendEmailId" text,
	"errorCode" text,
	"errorMessage" text,
	"openCount" integer DEFAULT 0 NOT NULL,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"lastClickedUrl" text,
	"acceptedAt" timestamp with time zone,
	"sentAt" timestamp with time zone,
	"deliveredAt" timestamp with time zone,
	"delayedAt" timestamp with time zone,
	"openedAt" timestamp with time zone,
	"clickedAt" timestamp with time zone,
	"bouncedAt" timestamp with time zone,
	"complainedAt" timestamp with time zone,
	"failedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_suppression" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"email" text NOT NULL,
	"reason" text NOT NULL,
	"messageId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_template" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"bodyMode" text DEFAULT 'rich' NOT NULL,
	"bodyDoc" jsonb,
	"bodyHtml" text NOT NULL,
	"createdByUserId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"connectionId" text NOT NULL,
	"eventKey" text NOT NULL,
	"eventType" text NOT NULL,
	"resendEmailId" text,
	"processedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resend_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"status" text DEFAULT 'connected' NOT NULL,
	"apiKeyEncrypted" text,
	"keyVersion" integer DEFAULT 1 NOT NULL,
	"keyScope" text DEFAULT 'full' NOT NULL,
	"keyLastFour" text,
	"fromName" text NOT NULL,
	"fromEmail" text NOT NULL,
	"replyTo" text,
	"domainId" text,
	"domainName" text,
	"domainStatus" text,
	"webhookId" text,
	"webhookSecretEncrypted" text,
	"webhookStatus" text DEFAULT 'missing' NOT NULL,
	"lastVerifiedAt" timestamp with time zone,
	"connectedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"disconnectedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_leadId_lead_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."lead"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_connectionId_resend_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."resend_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_templateId_email_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."email_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_sentByUserId_user_id_fk" FOREIGN KEY ("sentByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_suppression" ADD CONSTRAINT "email_suppression_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_suppression" ADD CONSTRAINT "email_suppression_messageId_email_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."email_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_webhook_event" ADD CONSTRAINT "email_webhook_event_connectionId_resend_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."resend_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resend_connection" ADD CONSTRAINT "resend_connection_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_message_lead_created_idx" ON "email_message" USING btree ("leadId","createdAt");--> statement-breakpoint
CREATE INDEX "email_message_business_created_idx" ON "email_message" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "email_message_resend_uidx" ON "email_message" USING btree ("resendEmailId") WHERE "email_message"."resendEmailId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "email_suppression_business_email_uidx" ON "email_suppression" USING btree ("businessId","email");--> statement-breakpoint
CREATE INDEX "email_template_business_updated_idx" ON "email_template" USING btree ("businessId","updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "email_webhook_event_key_uidx" ON "email_webhook_event" USING btree ("eventKey");--> statement-breakpoint
CREATE UNIQUE INDEX "resend_connection_business_uidx" ON "resend_connection" USING btree ("businessId");