-- Apply only after the application no longer references the retired schema.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
SET LOCAL statement_timeout = '60s';
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM discovery_job j JOIN agent_execution a ON a.id = j.id
    WHERE j.status IN ('queued', 'running')
  ) OR EXISTS (
    SELECT 1 FROM whatsapp_sequence
    WHERE "agentExecutionId" IS NOT NULL AND status = 'scheduled'
  ) THEN
    RAISE EXCEPTION 'Active Agents-owned channel jobs must be retired before dropping Agents tables';
  END IF;
END $$;
--> statement-breakpoint
DROP TRIGGER "lead_status_revision" ON "lead";
--> statement-breakpoint
DROP FUNCTION "scorelead_lead_status_revision"();
--> statement-breakpoint
DROP TABLE "agent_event";--> statement-breakpoint
DROP TABLE "agent_execution";--> statement-breakpoint
DROP TABLE "agent_revision";--> statement-breakpoint
DROP TABLE "agent_worker";--> statement-breakpoint
DROP TABLE "agent_workspace";--> statement-breakpoint
ALTER TABLE "lead" DROP COLUMN "statusRevision";--> statement-breakpoint
ALTER TABLE "whatsapp_sequence" DROP COLUMN "agentExecutionId";
