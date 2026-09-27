import { agentsEnabled } from "@/lib/agents/rollout";
import { reservePlanUsage } from "@/lib/usage-reservation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import {
  graphSchema,
  matchesFilter,
  nextAgent,
  type AgentGraph,
} from "@/lib/agents/model";
import {
  AgentError,
  workspace,
  saveDraft,
  publish,
  setPaused,
  transaction,
  enqueue,
  enqueueAudience,
  audienceWhere,
  event,
} from "@/lib/agents/store";
import {
  businessContext,
  leadContext,
  validatePublish,
  validateChannel,
} from "@/lib/agents/context";
import { prepareMessage } from "@/lib/agents/prepare";
import { PlanLimitError } from "@/lib/plan";

type Context = { params: Promise<{ id: string }> };
async function access(request: Request, context: Context) {
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new AgentError("FORBIDDEN", 403);
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new AgentError("UNAUTHORIZED", 401);
  const { id } = await context.params;
  const ctx = await businessContext(id, session.user.id);
  return { id, actorId: session.user.id, ...ctx };
}
function failure(error: unknown) {
  if (error instanceof AgentError)
    return NextResponse.json({ error: error.code }, { status: error.status });
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: "INVALID_GRAPH", issues: error.issues.map((i) => i.message) },
      { status: 400 },
    );
  if (error instanceof PlanLimitError)
    return NextResponse.json({ error: "PLAN_LIMIT" }, { status: 409 });
  console.error(
    "Agents API",
    error instanceof Error ? error.message : "Unknown error",
  );
  return NextResponse.json({ error: "REQUEST_FAILED" }, { status: 500 });
}
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await access(request, context);
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agentId"),
      view = url.searchParams.get("view");
    if (view === "activity" || view === "leads") {
      const cursor = url.searchParams.get("cursor");
      const values: unknown[] = [id, agentId];
      let after = "";
      if (cursor) {
        const parsed = z
          .object({ at: z.string().datetime(), id: z.string().uuid() })
          .parse(JSON.parse(cursor));
        values.push(parsed.at, parsed.id);
        after = ' AND (e."createdAt",e.id)<($3::timestamptz,$4)';
      }
      const { rows } = await pool.query(
        view === "activity"
          ? `SELECT e.* FROM agent_event e WHERE e."businessId"=$1 AND ($2::text IS NULL OR e."agentId"=$2) ${after} ORDER BY e."createdAt" DESC,e.id DESC LIMIT 51`
          : `SELECT e.*,l.name AS "leadName",COALESCE(em.status,ws.status) AS "deliveryStatus",COALESCE(em."resendEmailId",ws."metaMessageId") AS "providerMessageId" FROM agent_execution e LEFT JOIN email_message em ON em.id=e."providerId" AND em."businessId"=e."businessId" LEFT JOIN whatsapp_sequence_step ws ON ws."sequenceId"=e."providerId" LEFT JOIN lead l ON l.id=e."leadId" AND l."businessId"=e."businessId" WHERE e."businessId"=$1 AND ($2::text IS NULL OR e."agentId"=$2) ${after} ORDER BY e."createdAt" DESC,e.id DESC LIMIT 51`,
        values,
      );
      const items = rows.slice(0, 50),
        last = items.at(-1);
      return NextResponse.json({
        items,
        nextCursor:
          rows.length > 50
            ? JSON.stringify({ at: last.createdAt.toISOString(), id: last.id })
            : null,
      });
    }
    const [w, counters, templates, jobs, heartbeat] = await Promise.all([
      workspace(id),
      pool.query(
        'SELECT "agentId",status,count(*)::int AS count FROM agent_execution WHERE "businessId"=$1 GROUP BY "agentId",status',
        [id],
      ),
      pool.query(
        `SELECT t.id,t.name,t.language FROM whatsapp_template t JOIN whatsapp_connection c ON c.id=t."connectionId" WHERE c."businessId"=$1 AND t.status='APPROVED' AND t.supported=true`,
        [id],
      ),
      pool.query(
        'SELECT id,name FROM discovery_job WHERE "businessId"=$1 ORDER BY "createdAt" DESC LIMIT 100',
        [id],
      ),
      pool.query('SELECT max("heartbeatAt") AS last FROM agent_worker'),
    ]);
    return NextResponse.json({
      workspace: w,
      counters: counters.rows,
      templates: templates.rows,
      jobs: jobs.rows,
      workerEnabled: agentsEnabled(id),
      heartbeat: heartbeat.rows[0]?.last ?? null,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await access(request, context);
    const { graph, version } = z
      .object({ graph: graphSchema, version: z.number().int().min(0) })
      .parse(await request.json());
    return NextResponse.json({
      workspace: await saveDraft(id, graph, version),
    });
  } catch (e) {
    return failure(e);
  }
}
const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("preview"),
    version: z.number().int(),
    published: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("publish"),
    version: z.number().int(),
    includeCurrent: z.boolean(),
  }),
  z.object({
    action: z.literal("pause"),
    paused: z.boolean(),
    agentId: z.string().uuid().optional(),
  }),
  z.object({
    action: z.literal("run"),
    agentId: z.string().uuid(),
    leadIds: z.array(z.string()).max(500).optional(),
    requestId: z.string().uuid(),
    revisionId: z.string().uuid(),
    allMatching: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("simulate"),
    agentId: z.string().uuid(),
    leadId: z.string().max(100),
  }),
  z.object({ action: z.literal("retry"), executionId: z.string().uuid() }),
  z.object({ action: z.literal("cancel"), executionId: z.string().uuid() }),
]);
export async function POST(request: Request, context: Context) {
  try {
    const { id, actorId, owner } = await access(request, context);
    const body = actionSchema.parse(await request.json());
    const w = await workspace(id);
    if (body.action === "pause") {
      await setPaused(id, actorId, body.paused, body.agentId);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "preview") {
      if (w.version !== body.version)
        throw new AgentError("VERSION_CONFLICT", 409);
      const published =
        body.published && w.publishedRevisionId
          ? (
              await pool.query(
                'SELECT graph FROM agent_revision WHERE id=$1 AND "businessId"=$2',
                [w.publishedRevisionId, id],
              )
            ).rows[0]?.graph
          : null;
      const graph = graphSchema.parse(body.published ? published : w.draft);
      let validation: string | null = null;
      try {
        await validatePublish(id, actorId, graph);
      } catch (e) {
        validation = e instanceof AgentError ? e.code : "INVALID_GRAPH";
      }
      const agents = [];
      for (const a of graph.nodes) {
        if (a.kind === "discovery") {
          agents.push({ id: a.id, total: 0, samples: [] });
          continue;
        }
        const { values, where } = audienceWhere(a, id);
        const [
          {
            rows: [count],
          },
          { rows: samples },
        ] = await Promise.all([
          pool.query(
            `SELECT count(*)::int AS total FROM lead l WHERE ${where}`,
            values,
          ),
          pool.query(
            `SELECT l.id,l.name FROM lead l WHERE ${where} ORDER BY l."createdAt" DESC LIMIT ${body.published ? 500 : 5}`,
            values,
          ),
        ]);
        agents.push({ id: a.id, total: count.total, samples });
      }
      return NextResponse.json({
        agents,
        revisionId: w.publishedRevisionId,
        validation,
        workerEnabled: agentsEnabled(id),
      });
    }
    if (body.action === "publish") {
      if (w.version !== body.version)
        throw new AgentError("VERSION_CONFLICT", 409);
      await validatePublish(id, actorId, graphSchema.parse(w.draft));
      const revisionId = await publish(
        id,
        actorId,
        body.version,
        body.includeCurrent,
      );
      return NextResponse.json({ revisionId, workspace: await workspace(id) });
    }
    if (body.action === "simulate") {
      const graph = graphSchema.parse(w.draft),
        a = graph.nodes.find((n) => n.id === body.agentId);
      if (!a) throw new AgentError("AGENT_NOT_FOUND", 404);
      const l = await leadContext(id, body.leadId);
      if (!matchesFilter(a.filter, l.audience))
        throw new AgentError("FILTER_MISMATCH");
      await validateChannel(id, actorId, a);
      if (a.kind === "discovery") throw new AgentError("NO_SIMULATION");
      if (a.kind === "email" || a.kind === "whatsapp") {
        await reservePlanUsage(owner.id, "outreachMessage");
      }
      const prepared = await prepareMessage(id, actorId, a, body.leadId);
      await event(pool, id, a.id, null, "simulated", {
        leadId: body.leadId,
        actorId,
      });
      return NextResponse.json({
        prepared,
        nextAgent: nextAgent(graph, a.id, l.audience, "success") ?? null,
      });
    }
    if (body.action === "run") {
      if (body.revisionId !== w.publishedRevisionId)
        throw new AgentError("VERSION_CONFLICT", 409);
      if (!w.publishedRevisionId) throw new AgentError("NOT_PUBLISHED", 409);
      if (w.paused || w.pausedAgentIds.includes(body.agentId))
        throw new AgentError("PAUSED", 409);
      const {
        rows: [rev],
      } = await pool.query(
        'SELECT graph FROM agent_revision WHERE id=$1 AND "businessId"=$2',
        [w.publishedRevisionId, id],
      );
      const a = (rev.graph as AgentGraph).nodes.find(
        (n) => n.id === body.agentId,
      );
      if (!a) throw new AgentError("AGENT_NOT_FOUND", 404);
      await validateChannel(id, actorId, a);
      const count = await transaction(async (c) => {
        if (a.kind === "discovery")
          return (await enqueue(
            c,
            id,
            w.publishedRevisionId,
            a.id,
            null,
            `manual:${body.requestId}`,
          ))
            ? 1
            : 0;
        if (body.allMatching)
          return enqueueAudience(c, id, w.publishedRevisionId, a);
        if (!body.leadIds?.length) throw new AgentError("SELECT_LEADS");
        const {
          rows: [valid],
        } = await c.query(
          'SELECT count(*)::int AS count FROM lead WHERE "businessId"=$1 AND id=ANY($2::text[])',
          [id, [...new Set(body.leadIds)]],
        );
        if (valid.count !== new Set(body.leadIds).size)
          throw new AgentError("LEAD_NOT_FOUND", 404);
        return enqueueAudience(
          c,
          id,
          w.publishedRevisionId,
          a,
          null,
          body.leadIds,
        );
      });
      await event(pool, id, a.id, null, "batch_queued", { count, actorId });
      return NextResponse.json({ count });
    }
    await transaction(async (c) => {
      const {
        rows: [e],
      } = await c.query(
        'SELECT * FROM agent_execution WHERE id=$1 AND "businessId"=$2 FOR UPDATE',
        [body.executionId, id],
      );
      if (!e) throw new AgentError("EXECUTION_NOT_FOUND", 404);
      if (body.action === "retry") {
        if (e.requestStartedAt || !["blocked", "failed"].includes(e.status))
          throw new AgentError("UNSAFE_RETRY", 409);
        await c.query(
          'UPDATE agent_execution SET status=\'queued\',result=NULL,lease=NULL,"dueAt"=now(),"updatedAt"=now() WHERE id=$1',
          [e.id],
        );
      } else {
        if (e.status === "waiting") {
          const step = await c.query(
            `UPDATE whatsapp_sequence_step SET status='cancelled',"updatedAt"=now() WHERE "sequenceId"=$1 AND status='queued' AND "requestStartedAt" IS NULL RETURNING id`,
            [e.id],
          );
          const job = await c.query(
            `UPDATE discovery_job SET status='cancelled',"completedAt"=now() WHERE id=$1 AND status='queued' RETURNING id`,
            [e.id],
          );
          if (!step.rowCount && !job.rowCount)
            throw new AgentError("ALREADY_STARTED", 409);
          if (step.rowCount)
            await c.query(
              `UPDATE whatsapp_sequence SET status='cancelled',"cancelledAt"=now(),"updatedAt"=now() WHERE id=$1`,
              [e.id],
            );
        } else if (
          !["queued", "preparing", "blocked"].includes(e.status) ||
          e.requestStartedAt
        )
          throw new AgentError("ALREADY_STARTED", 409);
        await c.query(
          "UPDATE agent_execution SET status='cancelled',lease=NULL,\"updatedAt\"=now() WHERE id=$1",
          [e.id],
        );
      }
      await event(c, id, e.agentId, e.id, body.action, { actorId });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
