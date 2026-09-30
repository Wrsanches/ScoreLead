CREATE TABLE "github_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"owner" text NOT NULL,
	"repository" text NOT NULL,
	"defaultBranch" text NOT NULL,
	"encryptedToken" text NOT NULL,
	"contextPaths" jsonb DEFAULT '["README.md"]'::jsonb NOT NULL,
	"contextFiles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"projectNotes" text DEFAULT '' NOT NULL,
	"codexWorkflow" text,
	"contextSyncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"connectionId" text NOT NULL,
	"fromPhone" text NOT NULL,
	"contactName" text,
	"lastMessageId" text NOT NULL,
	"lastMessageAt" timestamp NOT NULL,
	"respondedThroughMessageId" text,
	"respondedAt" timestamp,
	"triageStatus" text DEFAULT 'queued' NOT NULL,
	"processingToken" text,
	"processingStartedAt" timestamp,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"retryAt" timestamp,
	"errorCode" text,
	"analyzedThroughMessageId" text,
	"classification" text,
	"summary" text,
	"suggestedReply" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_task" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"sourceMessageId" text NOT NULL,
	"proposal" jsonb NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"rejectionReason" text,
	"reviewedByUserId" text,
	"reviewedAt" timestamp,
	"githubRepository" text,
	"githubIssueNumber" integer,
	"githubIssueUrl" text,
	"codexStatus" text,
	"codexDispatchedAt" timestamp,
	"errorCode" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "conversationId" text;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "mediaId" text;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "mediaMimeType" text;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "mediaSha256" text;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "isVoiceNote" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD COLUMN "transcriptionError" text;--> statement-breakpoint
ALTER TABLE "github_connection" ADD CONSTRAINT "github_connection_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversation" ADD CONSTRAINT "support_conversation_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversation" ADD CONSTRAINT "support_conversation_connectionId_whatsapp_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_task" ADD CONSTRAINT "support_task_conversationId_support_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."support_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_task" ADD CONSTRAINT "support_task_sourceMessageId_whatsapp_inbound_message_id_fk" FOREIGN KEY ("sourceMessageId") REFERENCES "public"."whatsapp_inbound_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_task" ADD CONSTRAINT "support_task_reviewedByUserId_user_id_fk" FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_connection_business_uidx" ON "github_connection" USING btree ("businessId");--> statement-breakpoint
CREATE UNIQUE INDEX "support_conversation_recipient_uidx" ON "support_conversation" USING btree ("connectionId","fromPhone");--> statement-breakpoint
CREATE INDEX "support_conversation_business_idx" ON "support_conversation" USING btree ("businessId","lastMessageAt","id");--> statement-breakpoint
CREATE INDEX "support_conversation_queue_idx" ON "support_conversation" USING btree ("triageStatus","retryAt");--> statement-breakpoint
CREATE UNIQUE INDEX "support_task_source_uidx" ON "support_task" USING btree ("sourceMessageId");--> statement-breakpoint
CREATE INDEX "support_task_conversation_idx" ON "support_task" USING btree ("conversationId","createdAt");--> statement-breakpoint
ALTER TABLE "whatsapp_inbound_message" ADD CONSTRAINT "whatsapp_inbound_message_conversationId_support_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."support_conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_inbound_message_conversation_idx" ON "whatsapp_inbound_message" USING btree ("conversationId","receivedAt","id");
--> statement-breakpoint
-- Backfill stored inbound messages without automatically charging for old
-- conversations. Operators can explicitly analyze these through the inbox.
INSERT INTO "support_conversation" ("id", "businessId", "connectionId", "fromPhone", "lastMessageId", "lastMessageAt", "triageStatus")
SELECT gen_random_uuid()::text, connection."businessId", latest."connectionId", latest."fromPhone", latest."id", latest."receivedAt", 'idle'
FROM (
  SELECT DISTINCT ON ("connectionId", "fromPhone") * FROM "whatsapp_inbound_message"
  ORDER BY "connectionId", "fromPhone", "receivedAt" DESC, "createdAt" DESC, "id" DESC
) latest
INNER JOIN "whatsapp_connection" connection ON connection."id" = latest."connectionId"
ON CONFLICT ("connectionId", "fromPhone") DO NOTHING;
--> statement-breakpoint
UPDATE "whatsapp_inbound_message" message SET "conversationId" = conversation."id"
FROM "support_conversation" conversation
WHERE message."connectionId" = conversation."connectionId" AND message."fromPhone" = conversation."fromPhone"
  AND message."conversationId" IS NULL;
