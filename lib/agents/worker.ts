import { allowedBusinesses, agentsEnabled } from "./rollout";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import {
  agentExecution,
  whatsappSequence,
  whatsappSequenceStep,
  type WhatsAppTemplateParameter,
} from "@/lib/db/schema";
import { leadCap, PlanLimitError } from "@/lib/plan";
import { sendTemplateEmail, EmailSendError } from "@/lib/resend/send";
import { getResendConnection } from "@/lib/resend/data";
import { getWhatsAppConnection } from "@/lib/whatsapp/data";
import { isWithinSendWindow, partsInTimezone } from "@/lib/whatsapp/schedule";
import { businessDayBounds } from "@/lib/whatsapp/schedule";
import { businessContext, leadContext, validateChannel } from "./context";
import { prepareMessage } from "./prepare";
import {
  AgentError,
  enqueue,
  enqueueAudience,
  event,
  isExecutionEnabled,
  transaction,
} from "./store";
import { matchesFilter, nextAgent, type Agent, type AgentGraph } from "./model";
import { reserveUsage } from "./reservations";
type Execution = typeof agentExecution.$inferSelect;

export async function recoverExecutions() {
  await pool.query(
    `UPDATE agent_execution SET status=CASE WHEN "requestStartedAt" IS NULL THEN 'queued' ELSE 'needs_review' END,lease=NULL,result='WORKER_INTERRUPTED',"updatedAt"=now() WHERE status IN ('preparing','sending') AND "updatedAt"<now()-interval '10 minutes'`,
  );
}
export async function claimExecution(): Promise<Execution | undefined> {
  return transaction(async (c) => {
    const { rows } = await c.query<Execution>(
      `UPDATE agent_execution SET status='preparing',lease=$1,"updatedAt"=now() WHERE id=(
 SELECT e.id FROM agent_execution e JOIN agent_workspace w ON w."businessId"=e."businessId" JOIN business b ON b.id=e."businessId" JOIN "user" u ON u.id=b."userId"
 WHERE (cardinality($2::text[])=0 OR e."businessId"=ANY($2::text[])) AND e.status='queued' AND e."dueAt"<=now() AND NOT w.paused AND NOT(w."pausedAgentIds" ? e."agentId")
 AND NOT EXISTS(SELECT 1 FROM agent_execution active JOIN business ab ON ab.id=active."businessId" WHERE ab."userId"=b."userId" AND active.status IN('preparing','sending'))
 ORDER BY e."dueAt",e."createdAt" FOR UPDATE OF e,w,u SKIP LOCKED LIMIT 1) RETURNING *`,
      [randomUUID(), allowedBusinesses()],
    );
    return rows[0];
  });
}
async function defer(e: Execution, reason: string, seconds = 60) {
  await pool.query(
    `UPDATE agent_execution SET status='queued',result=$3,"dueAt"=now()+($4 * interval '1 second'),lease=NULL,"updatedAt"=now() WHERE id=$1 AND lease=$2`,
    [e.id, e.lease, reason, seconds],
  );
}
async function terminal(e: Execution, status: string, reason: string) {
  await transaction(async (c) => {
    const r = await c.query(
      'UPDATE agent_execution SET status=$3,result=$4,lease=NULL,"updatedAt"=now() WHERE id=$1 AND lease IS NOT DISTINCT FROM $2 RETURNING id',
      [e.id, e.lease, status, reason],
    );
    if (r.rowCount)
      await event(c, e.businessId, e.agentId, e.id, status, { reason });
  });
}
async function complete(
  e: Execution,
  g: AgentGraph,
  a: Agent,
  outcome: "success" | "failed" | "skipped",
  reason: string,
) {
  const ctx = e.leadId ? await leadContext(e.businessId, e.leadId) : null;
  await transaction(async (c) => {
    const r = await c.query(
      `UPDATE agent_execution SET status=$3,result=$4,lease=NULL,"updatedAt"=now() WHERE id=$1 AND lease IS NOT DISTINCT FROM $2 AND status NOT IN ('succeeded','failed','skipped','cancelled') RETURNING id`,
      [e.id, e.lease, outcome === "success" ? "succeeded" : outcome, reason],
    );
    if (!r.rowCount) return;
    await event(c, e.businessId, a.id, e.id, outcome, { reason });
    if (ctx) {
      const target = nextAgent(g, a.id, ctx.audience, outcome);
      if (target) {
        await enqueue(
          c,
          e.businessId,
          e.revisionId,
          target,
          ctx.lead.id,
          `lead:${ctx.lead.id}`,
        );
        await event(c, e.businessId, a.id, e.id, "forwarded", { target });
      }
    }
  });
}
async function updateStage(
  e: Execution,
  from: string,
  to: string,
  revision: number,
) {
  return transaction(async (c) => {
    const {
      rows: [current],
    } = await c.query(
      `SELECT id FROM agent_execution WHERE id=$1 AND lease IS NOT DISTINCT FROM $2 AND status IN ('preparing','sending','waiting','needs_review') FOR UPDATE`,
      [e.id, e.lease],
    );
    if (!current) return false;

    const r = await c.query(
      'UPDATE lead SET status=$4 WHERE id=$1 AND "businessId"=$2 AND status=$3 AND "statusRevision"=$5 RETURNING id',
      [e.leadId, e.businessId, from, to, revision],
    );
    await event(
      c,
      e.businessId,
      e.agentId,
      e.id,
      r.rowCount ? "stage_changed" : "stage_preserved",
      { from, to },
    );
    return !!r.rowCount;
  });
}
async function graphFor(e: Execution) {
  const {
    rows: [rev],
  } = await pool.query<{ graph: AgentGraph; actorId: string }>(
    'SELECT graph,"actorId" FROM agent_revision WHERE id=$1 AND "businessId"=$2',
    [e.revisionId, e.businessId],
  );
  if (!rev) throw new AgentError("REVISION_NOT_FOUND");
  const agent = rev.graph.nodes.find((a) => a.id === e.agentId);
  if (!agent) throw new AgentError("AGENT_NOT_FOUND");
  return { ...rev, agent };
}
async function dailyCapacity(e: Execution, a: Agent) {
  const bounds = businessDayBounds(new Date(), a.schedule.timezone);
  const {
    rows: [r],
  } = await pool.query(
    `SELECT count(*)::int AS count FROM agent_execution WHERE "businessId"=$1 AND "agentId"=$2 AND "requestStartedAt">=$3 AND "requestStartedAt"<$4`,
    [e.businessId, a.id, bounds.start, bounds.end],
  );
  return r.count < a.schedule.dailyLimit;
}
async function execute(e: Execution) {
  let graph: AgentGraph | undefined, agent: Agent | undefined;
  try {
    const definition = await graphFor(e);
    graph = definition.graph;
    agent = definition.agent;
    const { actorId } = definition;
    const ctx = await validateChannel(e.businessId, actorId, agent);
    if (!(await isExecutionEnabled(e.id))) {
      await defer(e, "PAUSED");
      return;
    }
    if (
      !isWithinSendWindow({
        now: new Date(),
        timezone: agent.schedule.timezone,
        allowedWeekdays: agent.schedule.weekdays,
        start: agent.schedule.start,
        end: agent.schedule.end,
      })
    ) {
      await defer(e, "OUTSIDE_WINDOW");
      return;
    }
    if (!(await dailyCapacity(e, agent))) {
      await defer(e, "DAILY_LIMIT", 300);
      return;
    }
    if (agent.kind === "discovery") {
      await reserveUsage(e.id, e.lease!, ctx.owner.id, "discoveryJobs");
      await transaction(async (c) => {
        const guarded = await c.query(
          `SELECT e.id FROM agent_execution e JOIN agent_workspace w ON w."businessId"=e."businessId" WHERE e.id=$1 AND e.lease=$2 AND e.status='preparing' AND NOT w.paused AND NOT(w."pausedAgentIds" ? e."agentId") FOR UPDATE OF e,w`,
          [e.id, e.lease],
        );
        if (!guarded.rowCount) throw new AgentError("PAUSED");
        await c.query(
          `INSERT INTO discovery_job (id,"businessId","userId",name,country,location,keywords,"maxResults","serviceArea",status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'local','queued')`,
          [
            e.id,
            e.businessId,
            ctx.owner.id,
            agent!.name,
            (agent as Extract<Agent, { kind: "discovery" }>).country,
            (agent as Extract<Agent, { kind: "discovery" }>).location,
            JSON.stringify(
              (agent as Extract<Agent, { kind: "discovery" }>).keywords,
            ),
            leadCap(
              ctx.plan,
              (agent as Extract<Agent, { kind: "discovery" }>).maxResults,
            ),
          ],
        );
        await c.query(
          'UPDATE agent_execution SET status=\'waiting\',"providerId"=$1,"requestStartedAt"=now(),lease=NULL,"updatedAt"=now() WHERE id=$1 AND lease=$2',
          [e.id, e.lease],
        );
        await event(c, e.businessId, e.agentId, e.id, "discovery_queued");
      });
      return;
    }
    if (!e.leadId) throw new AgentError("LEAD_NOT_FOUND");
    let l = await leadContext(e.businessId, e.leadId);
    if (!matchesFilter(agent.filter, l.audience)) {
      await complete(e, graph, agent, "skipped", "FILTER_MISMATCH");
      return;
    }
    if (agent.kind === "stage") {
      if (!(await isExecutionEnabled(e.id))) {
        await defer(e, "PAUSED");
        return;
      }
      if (l.lead.status !== agent.from) {
        await complete(e, graph, agent, "skipped", "STAGE_CHANGED");
        return;
      }
      const currentAgent = agent;
      await transaction(async (c) => {
        const guard = await c.query(
          `SELECT e.id FROM agent_execution e JOIN agent_workspace w ON w."businessId"=e."businessId" WHERE e.id=$1 AND e.lease=$2 AND e.status='preparing' AND NOT w.paused AND NOT(w."pausedAgentIds" ? e."agentId") FOR UPDATE OF e,w`,
          [e.id, e.lease],
        );
        if (!guard.rowCount) return;
        const changed = await c.query(
          'UPDATE lead SET status=$4 WHERE id=$1 AND "businessId"=$2 AND status=$3 AND "statusRevision"=$5 RETURNING id',
          [
            e.leadId,
            e.businessId,
            currentAgent.from,
            currentAgent.to,
            l.lead.statusRevision,
          ],
        );
        const outcome = changed.rowCount ? "success" : "skipped";
        await c.query(
          `UPDATE agent_execution SET status=$2,result=$3,"requestStartedAt"=now(),lease=NULL,"updatedAt"=now() WHERE id=$1`,
          [
            e.id,
            changed.rowCount ? "succeeded" : "skipped",
            changed.rowCount ? "STAGE_CHANGED" : "STAGE_PRESERVED",
          ],
        );
        await event(
          c,
          e.businessId,
          e.agentId,
          e.id,
          changed.rowCount ? "stage_changed" : "stage_preserved",
          { from: currentAgent.from, to: currentAgent.to },
        );
        const target = nextAgent(
          graph!,
          e.agentId,
          {
            ...l.audience,
            status: changed.rowCount ? currentAgent.to : l.audience.status,
          },
          outcome,
        );
        if (target) {
          await enqueue(
            c,
            e.businessId,
            e.revisionId,
            target,
            e.leadId,
            `lead:${e.leadId}`,
          );
          await event(c, e.businessId, e.agentId, e.id, "forwarded", {
            target,
          });
        }
      });
      return;
    }
    if (
      (agent.kind === "email" && !l.email) ||
      (agent.kind === "whatsapp" && !l.audience.whatsappEligible)
    ) {
      await complete(e, graph, agent, "skipped", "RECIPIENT_INELIGIBLE");
      return;
    }
    let prepared = e.prepared;
    if (!prepared) {
      await reserveUsage(e.id, e.lease!, ctx.owner.id, "outreachMessages");
      prepared = await prepareMessage(e.businessId, actorId, agent, e.leadId);
      const r = await pool.query(
        `UPDATE agent_execution SET prepared=$3,"updatedAt"=now() WHERE id=$1 AND lease=$2 AND status='preparing' RETURNING id`,
        [e.id, e.lease, JSON.stringify(prepared)],
      );
      if (!r.rowCount) return;
      await event(pool, e.businessId, e.agentId, e.id, "prepared", {
        to: prepared.to,
      });
    }
    // Recheck after generation: consent, permissions, audience and pause can change while the model runs.
    l = await leadContext(e.businessId, e.leadId);
    await validateChannel(e.businessId, actorId, agent);
    if (!(await isExecutionEnabled(e.id))) {
      await defer(e, "PAUSED");
      return;
    }
    if (
      !matchesFilter(agent.filter, l.audience) ||
      l.lead.statusRevision !== prepared.statusRevision
    ) {
      await complete(e, graph, agent, "skipped", "LEAD_CHANGED");
      return;
    }
    if (agent.kind === "email") {
      if (l.email !== prepared.to) throw new AgentError("RECIPIENT_CHANGED");
      const {
        rows: [recent],
      } = await pool.query(
        `SELECT count(*)::int AS count FROM email_message WHERE "businessId"=$1 AND "createdAt">now()-interval '1 minute'`,
        [e.businessId],
      );
      if (recent.count >= 20) {
        await defer(e, "RATE_LIMITED");
        return;
      }
      const connection = await getResendConnection(e.businessId);
      if (!connection) throw new AgentError("EMAIL_NOT_CONNECTED");
      const r = await pool.query(
        'UPDATE agent_execution SET status=\'sending\',"requestStartedAt"=now(),"providerId"=$1,"updatedAt"=now() WHERE id=$1 AND lease=$2 AND status=\'preparing\' AND EXISTS(SELECT 1 FROM agent_workspace w WHERE w."businessId"=agent_execution."businessId" AND NOT w.paused AND NOT(w."pausedAgentIds" ? agent_execution."agentId")) RETURNING id',
        [e.id, e.lease],
      );
      if (!r.rowCount) return;
      e.requestStartedAt = new Date();
      await sendTemplateEmail({
        connection,
        lead: l.lead,
        business: ctx.business,
        senderName: ctx.owner.name,
        to: l.email!,
        sentByUserId: actorId,
        messageId: e.id,
        prepared: {
          subject: String(prepared.subject),
          body: String(prepared.body),
        },
      });
      if (agent.markContacted && prepared.originalStatus === "new")
        await updateStage(
          e,
          "new",
          "contacted",
          Number(prepared.statusRevision),
        );
      await complete(e, graph, agent, "success", "ACCEPTED");
      return;
    }
    if (l.consent?.status !== "granted" || l.consent.phoneE164 !== prepared.to)
      throw new AgentError("CONSENT_CHANGED");
    const connection = await getWhatsAppConnection(e.businessId);
    if (!connection) throw new AgentError("WHATSAPP_NOT_CONNECTED");
    const p = prepared as unknown as {
      template: {
        metaTemplateId: string;
        name: string;
        language: string;
        components: typeof whatsappSequenceStep.$inferInsert.templateComponents;
      };
      parameters: WhatsAppTemplateParameter[];
      body: string;
    };
    const consent = l.consent;
    await db.transaction(async (tx) => {
      const guard = await tx.execute(
        sql`SELECT e.id FROM agent_execution e JOIN agent_workspace w ON w."businessId"=e."businessId" WHERE e.id=${e.id} AND e.lease=${e.lease} AND e.status='preparing' AND NOT w.paused AND NOT(w."pausedAgentIds" ? e."agentId") FOR UPDATE OF e,w`,
      );
      if (!guard.rowCount) throw new AgentError("PAUSED");
      await tx.insert(whatsappSequence).values({
        id: e.id,
        agentExecutionId: e.id,
        businessId: e.businessId,
        leadId: e.leadId!,
        connectionId: connection.id,
        recipientPhone: consent.phoneE164,
        status: "scheduled",
        timezone: connection.timezone,
        consentSnapshot: {
          eventId: consent.id,
          status: "granted",
          phoneE164: consent.phoneE164,
          purpose: consent.purpose,
          source: consent.source,
          capturedAt: consent.capturedAt.toISOString(),
          evidenceReference: consent.evidenceReference,
        },
        approvedByUserId: actorId,
        approvedAt: new Date(),
      });
      await tx.insert(whatsappSequenceStep).values({
        id: randomUUID(),
        sequenceId: e.id,
        position: 1,
        offsetDays: 0,
        localSendTime: connection.sendWindowStart,
        scheduledAt: new Date(),
        status: "queued",
        metaTemplateId: p.template.metaTemplateId,
        templateName: p.template.name,
        templateLanguage: p.template.language,
        templateComponents: p.template.components,
        templateParameters: p.parameters,
        renderedBody: p.body,
      });
      await tx
        .update(agentExecution)
        .set({
          status: "waiting",
          providerId: e.id,
          requestStartedAt: new Date(),
          lease: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(agentExecution.id, e.id), eq(agentExecution.lease, e.lease!)),
        );
    });
    await event(pool, e.businessId, e.agentId, e.id, "whatsapp_queued");
  } catch (error) {
    const code =
      error instanceof AgentError
        ? error.code
        : error instanceof EmailSendError
          ? error.code
          : error instanceof PlanLimitError
            ? "PLAN_LIMIT"
            : "ACTION_FAILED";
    if (
      e.requestStartedAt &&
      (!(error instanceof EmailSendError) || error.code === "PROVIDER_ERROR")
    ) {
      await terminal(e, "needs_review", "PROVIDER_RESULT_UNKNOWN");
      return;
    }
    if (graph && agent && error instanceof EmailSendError) {
      await complete(e, graph, agent, "failed", code);
      return;
    }
    await terminal(e, "blocked", code);
  }
}
export async function reconcileWaiting() {
  const { rows } = await pool.query<Execution>(
    `SELECT * FROM agent_execution WHERE status IN('waiting','needs_review') ORDER BY "updatedAt" LIMIT 200`,
  );
  for (const e of rows) {
    try {
      const { graph, agent, actorId } = await graphFor(e);
      if (agent.kind === "discovery") {
        const {
          rows: [job],
        } = await pool.query("SELECT status FROM discovery_job WHERE id=$1", [
          e.providerId,
        ]);
        if (
          !job ||
          !["completed", "failed", "cancelled", "exhausted"].includes(
            job.status,
          )
        )
          continue;
        await businessContext(e.businessId, actorId);
        await transaction(async (c) => {
          const { rows: leads } = await c.query(
            'SELECT id FROM lead WHERE "jobId"=$1 AND "businessId"=$2',
            [e.providerId, e.businessId],
          );
          for (const row of leads) {
            const l = await leadContext(e.businessId, row.id);
            const target = nextAgent(graph, agent.id, l.audience, "success");
            if (target)
              await enqueue(
                c,
                e.businessId,
                e.revisionId,
                target,
                row.id,
                `lead:${row.id}`,
              );
          }
        });
        await complete(
          e,
          graph,
          agent,
          job.status === "failed" ? "failed" : "success",
          job.status,
        );
        continue;
      }
      if (agent.kind === "email" || agent.kind === "whatsapp") {
        const {
          rows: [message],
        } = await pool.query(
          agent.kind === "email"
            ? 'SELECT status,"acceptedAt" FROM email_message WHERE id=$1'
            : 'SELECT status,"acceptedAt" FROM whatsapp_sequence_step WHERE "sequenceId"=$1',
          [e.providerId],
        );
        if (!message) continue;
        if (message.acceptedAt) {
          if (agent.markContacted && e.prepared?.originalStatus === "new")
            await updateStage(
              e,
              "new",
              "contacted",
              Number(e.prepared.statusRevision),
            );
          await complete(e, graph, agent, "success", "ACCEPTED");
        } else if (
          e.status !== "needs_review" &&
          ["failed", "blocked", "cancelled"].includes(message.status)
        )
          await complete(
            e,
            graph,
            agent,
            message.status === "failed" ? "failed" : "skipped",
            message.status,
          );
        else if (
          message.status === "needs_review" &&
          e.status !== "needs_review"
        )
          await terminal(e, "needs_review", "PROVIDER_RESULT_UNKNOWN");
      }
    } catch {
      // Keep unresolved executions visible without logging the same error every poll.
    } finally {
      await pool.query(
        `UPDATE agent_execution SET "updatedAt"=now() WHERE id=$1 AND status IN ('waiting','needs_review')`,
        [e.id],
      );
    }
  }
}
export function scheduleSlot(a: Agent, now: Date): string | null {
  if (a.schedule.cadence === "off") return null;
  const local = partsInTimezone(now, a.schedule.timezone);
  const day = new Date(
    Date.UTC(local.year, local.month - 1, local.day),
  ).getUTCDay();
  if (
    !a.schedule.weekdays.includes(day) ||
    (a.schedule.cadence === "weekly" && day !== a.schedule.weekdays[0])
  )
    return null;
  const time = `${String(local.hour).padStart(2, "0")}:${String(local.minute).padStart(2, "0")}`;
  if (time < a.schedule.start || time >= a.schedule.end) return null;
  return `${local.year}-${local.month}-${local.day}`;
}
export async function scheduleAgents() {
  const { rows } = await pool.query(
    `SELECT w.*,r.graph,r."actorId" FROM agent_workspace w JOIN agent_revision r ON r.id=w."publishedRevisionId" WHERE NOT w.paused`,
  );
  for (const w of rows) {
    if (!agentsEnabled(w.businessId)) continue;
    const graph = w.graph as AgentGraph;
    for (const a of graph.nodes) {
      if (w.pausedAgentIds.includes(a.id)) continue;
      try {
        await validateChannel(w.businessId, w.actorId, a);
        if (a.kind === "discovery") {
          const slot = scheduleSlot(a, new Date());
          if (slot)
            await enqueue(
              pool,
              w.businessId,
              w.publishedRevisionId,
              a.id,
              null,
              `schedule:${slot}`,
            );
        } else if (a.automatic && !graph.edges.some((e) => e.target === a.id))
          await enqueueAudience(
            pool,
            w.businessId,
            w.publishedRevisionId,
            a,
            new Date(w.enrollmentStarts[a.id] ?? w.activatedAt),
          );
      } catch {
        /* Display readiness through the API; never bypass unavailable integrations. */
      }
    }
  }
}
export async function pumpAgents() {
  if (process.env.AGENTS_EXECUTION_ENABLED !== "true") return;
  await recoverExecutions();
  await reconcileWaiting();
  for (let i = 0; i < 20; i++) {
    const e = await claimExecution();
    if (!e) break;
    await execute(e);
  }
}
/** WhatsApp owns delivery. Its final send guard must also honor the agent's current controls and limits. */
export async function agentWhatsAppReady(id: string) {
  if (!(await isExecutionEnabled(id))) return false;
  const {
    rows: [e],
  } = await pool.query<Execution>("SELECT * FROM agent_execution WHERE id=$1", [
    id,
  ]);
  if (!e) return false;
  const { agent, actorId } = await graphFor(e);
  await validateChannel(e.businessId, actorId, agent);
  if (agent.kind !== "whatsapp" || !e.leadId)
    throw new AgentError("INVALID_GRAPH");
  const current = await leadContext(e.businessId, e.leadId);
  if (
    !matchesFilter(agent.filter, current.audience) ||
    current.lead.statusRevision !== e.prepared?.statusRevision ||
    current.consent?.phoneE164 !== e.prepared?.to
  )
    throw new AgentError("LEAD_CHANGED");
  if (
    !isWithinSendWindow({
      now: new Date(),
      timezone: agent.schedule.timezone,
      allowedWeekdays: agent.schedule.weekdays,
      start: agent.schedule.start,
      end: agent.schedule.end,
    })
  )
    return false;
  const bounds = businessDayBounds(new Date(), agent.schedule.timezone);
  const {
    rows: [count],
  } = await pool.query(
    `SELECT count(*)::int AS count FROM whatsapp_sequence_step s JOIN agent_execution e ON e.id=s."sequenceId" WHERE e."businessId"=$1 AND e."agentId"=$2 AND s."acceptedAt">=$3 AND s."acceptedAt"<$4`,
    [e.businessId, e.agentId, bounds.start, bounds.end],
  );
  return count.count < agent.schedule.dailyLimit;
}

export async function agentDiscoveryAuthorized(id: string) {
  const {
    rows: [e],
  } = await pool.query<Execution>("SELECT * FROM agent_execution WHERE id=$1", [
    id,
  ]);
  if (!e) return true;
  try {
    const { agent, actorId } = await graphFor(e);
    const ctx = await validateChannel(e.businessId, actorId, agent);
    if (agent.kind !== "discovery") return false;
    await pool.query(
      'UPDATE discovery_job SET "maxResults"=LEAST("maxResults",$2) WHERE id=$1',
      [id, leadCap(ctx.plan, agent.maxResults)],
    );
    return true;
  } catch {
    return false;
  }
}
