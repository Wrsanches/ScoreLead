CREATE TABLE "support_artifact_cleanup" (
	"id" text PRIMARY KEY NOT NULL,
	"vectorStoreId" text,
	"fileId" text,
	"deleteAfter" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_assistant" (
	"businessId" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"handoffMessage" text DEFAULT 'Vou encaminhar sua pergunta para a equipe de atendimento.' NOT NULL,
	"repository" text,
	"repositoryId" text,
	"installationId" text,
	"githubUserId" text,
	"branch" text,
	"includePaths" jsonb DEFAULT '["README.md","docs/"]'::jsonb NOT NULL,
	"grantToken" text,
	"grantUserId" text,
	"grantGithubUserId" text,
	"grantExpiresAt" timestamp,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"syncRequestedAt" timestamp,
	"syncStartedAt" timestamp,
	"syncToken" text,
	"snapshotSha" text,
	"snapshotPaths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skippedFiles" integer DEFAULT 0 NOT NULL,
	"vectorStoreId" text,
	"fileId" text,
	"lastSyncedAt" timestamp,
	"errorCode" text,
	"previewedVersion" integer,
	"lastPreviewAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"connectionId" text NOT NULL,
	"phone" text NOT NULL,
	"mode" text DEFAULT 'bot' NOT NULL,
	"lastMessageAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_github_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"receivedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_github_state" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"userId" text NOT NULL,
	"verifier" text NOT NULL,
	"locale" text NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_reply" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"inboundId" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"body" text,
	"handoff" boolean DEFAULT false NOT NULL,
	"metaMessageId" text,
	"errorCode" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_assistant" ADD CONSTRAINT "support_assistant_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversation" ADD CONSTRAINT "support_conversation_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversation" ADD CONSTRAINT "support_conversation_connectionId_whatsapp_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_github_state" ADD CONSTRAINT "support_github_state_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_github_state" ADD CONSTRAINT "support_github_state_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_reply" ADD CONSTRAINT "support_reply_conversationId_support_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."support_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_reply" ADD CONSTRAINT "support_reply_inboundId_whatsapp_inbound_message_id_fk" FOREIGN KEY ("inboundId") REFERENCES "public"."whatsapp_inbound_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_assistant_installation_idx" ON "support_assistant" USING btree ("installationId");--> statement-breakpoint
CREATE UNIQUE INDEX "support_conversation_recipient_uidx" ON "support_conversation" USING btree ("connectionId","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "support_reply_inbound_uidx" ON "support_reply" USING btree ("inboundId");--> statement-breakpoint
CREATE INDEX "support_reply_queue_idx" ON "support_reply" USING btree ("status","createdAt");
--> statement-breakpoint
-- Preserve cleanup work when a business/account deletion cascades to its assistant.
CREATE FUNCTION retire_deleted_support_artifacts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."vectorStoreId" IS NOT NULL OR OLD."fileId" IS NOT NULL THEN
    INSERT INTO support_artifact_cleanup (id, "vectorStoreId", "fileId")
      VALUES (gen_random_uuid()::text, OLD."vectorStoreId", OLD."fileId");
  END IF;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER support_assistant_delete_cleanup BEFORE DELETE ON support_assistant
FOR EACH ROW EXECUTE FUNCTION retire_deleted_support_artifacts();
