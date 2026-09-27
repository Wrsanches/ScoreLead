CREATE TABLE "agent_event" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"executionId" text,
	"agentId" text,
	"kind" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"revisionId" text NOT NULL,
	"agentId" text NOT NULL,
	"leadId" text,
	"dedupe" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"result" text,
	"prepared" jsonb,
	"providerId" text,
	"lease" text,
	"requestStartedAt" timestamp with time zone,
	"dueAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"graph" jsonb NOT NULL,
	"actorId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_worker" (
	"id" text PRIMARY KEY NOT NULL,
	"heartbeatAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_workspace" (
	"businessId" text PRIMARY KEY NOT NULL,
	"draft" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"publishedRevisionId" text,
	"paused" boolean DEFAULT true NOT NULL,
	"pausedAgentIds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activatedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "statusRevision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_sequence" ADD COLUMN "agentExecutionId" text;--> statement-breakpoint
ALTER TABLE "agent_event" ADD CONSTRAINT "agent_event_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_event" ADD CONSTRAINT "agent_event_executionId_agent_execution_id_fk" FOREIGN KEY ("executionId") REFERENCES "public"."agent_execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution" ADD CONSTRAINT "agent_execution_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution" ADD CONSTRAINT "agent_execution_revisionId_agent_revision_id_fk" FOREIGN KEY ("revisionId") REFERENCES "public"."agent_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution" ADD CONSTRAINT "agent_execution_leadId_lead_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."lead"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_revision" ADD CONSTRAINT "agent_revision_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_revision" ADD CONSTRAINT "agent_revision_actorId_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workspace" ADD CONSTRAINT "agent_workspace_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_event_business" ON "agent_event" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_execution_dedupe" ON "agent_execution" USING btree ("businessId","agentId","dedupe");--> statement-breakpoint
CREATE INDEX "agent_execution_due" ON "agent_execution" USING btree ("status","dueAt");--> statement-breakpoint
CREATE INDEX "agent_execution_business" ON "agent_execution" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE FUNCTION scorelead_lead_status_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW."statusRevision" := OLD."statusRevision" + 1; RETURN NEW; END;
$$;
--> statement-breakpoint
CREATE TRIGGER lead_status_revision BEFORE UPDATE OF status ON lead FOR EACH ROW EXECUTE FUNCTION scorelead_lead_status_revision();
