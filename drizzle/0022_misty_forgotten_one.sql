CREATE TABLE "whatsapp_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"wabaId" text NOT NULL,
	"phoneNumberId" text NOT NULL,
	"displayPhoneNumber" text,
	"verifiedName" text,
	"status" text DEFAULT 'connected' NOT NULL,
	"encryptedAccessToken" text,
	"tokenKeyVersion" integer DEFAULT 1 NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"allowedWeekdays" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
	"dailyLimit" integer DEFAULT 20 NOT NULL,
	"sendWindowStart" text DEFAULT '09:00' NOT NULL,
	"sendWindowEnd" text DEFAULT '17:00' NOT NULL,
	"connectedAt" timestamp DEFAULT now() NOT NULL,
	"disconnectedAt" timestamp,
	"lastTemplateSyncAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_consent_event" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"leadId" text NOT NULL,
	"recordedByUserId" text,
	"phoneE164" text NOT NULL,
	"status" text NOT NULL,
	"purpose" text DEFAULT 'marketing' NOT NULL,
	"source" text NOT NULL,
	"capturedAt" timestamp NOT NULL,
	"evidenceReference" text,
	"evidenceNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_inbound_message" (
	"id" text PRIMARY KEY NOT NULL,
	"connectionId" text NOT NULL,
	"leadId" text,
	"metaMessageId" text NOT NULL,
	"fromPhone" text NOT NULL,
	"messageType" text NOT NULL,
	"textBody" text,
	"receivedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sequence" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"leadId" text NOT NULL,
	"connectionId" text NOT NULL,
	"recipientPhone" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"timezone" text NOT NULL,
	"approvedByUserId" text,
	"approvedAt" timestamp,
	"pausedAt" timestamp,
	"pauseReason" text,
	"completedAt" timestamp,
	"cancelledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sequence_step" (
	"id" text PRIMARY KEY NOT NULL,
	"sequenceId" text NOT NULL,
	"position" integer NOT NULL,
	"offsetDays" integer NOT NULL,
	"localSendTime" text NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"metaTemplateId" text NOT NULL,
	"templateName" text NOT NULL,
	"templateLanguage" text NOT NULL,
	"templateComponents" jsonb NOT NULL,
	"templateParameters" jsonb NOT NULL,
	"renderedBody" text NOT NULL,
	"metaMessageId" text,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"retryAt" timestamp,
	"requestStartedAt" timestamp,
	"acceptedAt" timestamp,
	"sentAt" timestamp,
	"deliveredAt" timestamp,
	"readAt" timestamp,
	"failedAt" timestamp,
	"errorCode" text,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_signup_nonce" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_template" (
	"id" text PRIMARY KEY NOT NULL,
	"connectionId" text NOT NULL,
	"metaTemplateId" text NOT NULL,
	"name" text NOT NULL,
	"language" text NOT NULL,
	"category" text NOT NULL,
	"status" text NOT NULL,
	"components" jsonb NOT NULL,
	"supported" boolean DEFAULT false NOT NULL,
	"rejectionReason" text,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"eventKey" text NOT NULL,
	"eventType" text NOT NULL,
	"processedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_connection" ADD CONSTRAINT "whatsapp_connection_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_consent_event" ADD CONSTRAINT "whatsapp_consent_event_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_consent_event" ADD CONSTRAINT "whatsapp_consent_event_leadId_lead_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."lead"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_consent_event" ADD CONSTRAINT "whatsapp_consent_event_recordedByUserId_user_id_fk" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD CONSTRAINT "whatsapp_inbound_message_connectionId_whatsapp_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD CONSTRAINT "whatsapp_inbound_message_leadId_lead_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."lead"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sequence" ADD CONSTRAINT "whatsapp_sequence_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sequence" ADD CONSTRAINT "whatsapp_sequence_leadId_lead_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."lead"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sequence" ADD CONSTRAINT "whatsapp_sequence_connectionId_whatsapp_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sequence" ADD CONSTRAINT "whatsapp_sequence_approvedByUserId_user_id_fk" FOREIGN KEY ("approvedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sequence_step" ADD CONSTRAINT "whatsapp_sequence_step_sequenceId_whatsapp_sequence_id_fk" FOREIGN KEY ("sequenceId") REFERENCES "public"."whatsapp_sequence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_signup_nonce" ADD CONSTRAINT "whatsapp_signup_nonce_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_signup_nonce" ADD CONSTRAINT "whatsapp_signup_nonce_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_template" ADD CONSTRAINT "whatsapp_template_connectionId_whatsapp_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_connection_business_uidx" ON "whatsapp_connection" USING btree ("businessId");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_connection_phone_number_uidx" ON "whatsapp_connection" USING btree ("phoneNumberId");--> statement-breakpoint
CREATE INDEX "whatsapp_connection_waba_idx" ON "whatsapp_connection" USING btree ("wabaId");--> statement-breakpoint
CREATE INDEX "whatsapp_consent_lead_phone_idx" ON "whatsapp_consent_event" USING btree ("leadId","phoneE164","createdAt");--> statement-breakpoint
CREATE INDEX "whatsapp_consent_business_phone_idx" ON "whatsapp_consent_event" USING btree ("businessId","phoneE164","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_inbound_message_meta_uidx" ON "whatsapp_inbound_message" USING btree ("metaMessageId");--> statement-breakpoint
CREATE INDEX "whatsapp_inbound_message_recipient_idx" ON "whatsapp_inbound_message" USING btree ("connectionId","fromPhone","receivedAt");--> statement-breakpoint
CREATE INDEX "whatsapp_sequence_lead_idx" ON "whatsapp_sequence" USING btree ("leadId","createdAt");--> statement-breakpoint
CREATE INDEX "whatsapp_sequence_recipient_idx" ON "whatsapp_sequence" USING btree ("businessId","recipientPhone","status");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_sequence_step_position_uidx" ON "whatsapp_sequence_step" USING btree ("sequenceId","position");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_sequence_step_message_uidx" ON "whatsapp_sequence_step" USING btree ("metaMessageId");--> statement-breakpoint
CREATE INDEX "whatsapp_sequence_step_queue_idx" ON "whatsapp_sequence_step" USING btree ("status","scheduledAt","retryAt");--> statement-breakpoint
CREATE INDEX "whatsapp_signup_nonce_business_idx" ON "whatsapp_signup_nonce" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "whatsapp_signup_nonce_expires_idx" ON "whatsapp_signup_nonce" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_template_meta_uidx" ON "whatsapp_template" USING btree ("connectionId","metaTemplateId");--> statement-breakpoint
CREATE INDEX "whatsapp_template_selectable_idx" ON "whatsapp_template" USING btree ("connectionId","status","supported");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_webhook_event_key_uidx" ON "whatsapp_webhook_event" USING btree ("eventKey");