import { agentsEnabled } from "./rollout";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import type { Agent, AgentGraph } from "./model";
export class AgentError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export async function transaction<T>(
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function event(
  c: Pick<PoolClient, "query">,
  businessId: string,
  agentId: string | null,
  executionId: string | null,
  kind: string,
  detail: Record<string, unknown> = {},
) {
  await c.query(
    'INSERT INTO agent_event (id,"businessId","agentId","executionId",kind,detail) VALUES ($1,$2,$3,$4,$5,$6)',
    [
      randomUUID(),
      businessId,
      agentId,
      executionId,
      kind,
      JSON.stringify(detail),
    ],
  );
}
export async function workspace(businessId: string) {
  const { rows } = await pool.query(
    `SELECT w.*,COALESCE((SELECT jsonb_agg(n->>'id') FROM agent_revision r, jsonb_array_elements(r.graph->'nodes') n WHERE r.id=w."publishedRevisionId"),'[]'::jsonb) AS "publishedAgentIds" FROM agent_workspace w WHERE w."businessId"=$1`,
    [businessId],
  );
  return (
    rows[0] ?? {
      businessId,
      draft: { nodes: [], edges: [] },
      version: 0,
      publishedRevisionId: null,
      paused: true,
      pausedAgentIds: [],
    }
  );
}
export async function saveDraft(
  businessId: string,
  graph: AgentGraph,
  version: number,
) {
  return transaction(async (c) => {
    await c.query(
      'INSERT INTO agent_workspace ("businessId",draft) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [businessId, JSON.stringify({ nodes: [], edges: [] })],
    );
    const { rows } = await c.query(
      'UPDATE agent_workspace SET draft=$2,version=version+1,"updatedAt"=now() WHERE "businessId"=$1 AND version=$3 RETURNING *',
      [businessId, JSON.stringify(graph), version],
    );
    if (!rows[0]) throw new AgentError("VERSION_CONFLICT", 409);
    return rows[0];
  });
}
export async function enqueue(
  c: Pick<PoolClient, "query">,
  businessId: string,
  revisionId: string,
  agentId: string,
  leadId: string | null,
  dedupe: string,
) {
  const { rows } = await c.query(
    'INSERT INTO agent_execution (id,"businessId","revisionId","agentId","leadId",dedupe) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id',
    [randomUUID(), businessId, revisionId, agentId, leadId, dedupe],
  );
  return rows[0]?.id as string | undefined;
}
/** SQL narrows the audience; channel eligibility is always rechecked before action. */
export function audienceWhere(
  agent: Agent,
  businessId: string,
  since: Date | null = null,
) {
  const values: unknown[] = [businessId];
  const clauses = ['l."businessId"=$1'];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    clauses.push(sql.replace("?", `$${values.length}`));
  };
  const f = agent.filter;
  if (f.status) add("l.status=?", f.status);
  if (f.source) add("l.source=?", f.source);
  if (f.jobId) add('l."jobId"=?', f.jobId);
  if (f.location)
    add(
      "concat_ws(' ',l.city,l.state,l.country) ILIKE ?",
      `%${f.location.replace(/[\\%_]/g, "\\$&")}%`,
    );
  add("l.score>=?", f.minScore);
  add("l.score<=?", f.maxScore);
  if (since) add('l."createdAt">=?', since);
  if (agent.kind === "email" || f.channel === "email")
    clauses.push(`EXISTS (
    SELECT 1 FROM (SELECT l.email AS email UNION SELECT jsonb_array_elements_text(COALESCE(l.emails,'[]'::jsonb)) UNION SELECT d->>'email' FROM jsonb_array_elements(COALESCE(l."decisionMakers",'[]'::jsonb)) d) addresses
    WHERE addresses.email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    AND NOT EXISTS(SELECT 1 FROM email_suppression s WHERE s."businessId"=l."businessId" AND s.email=lower(trim(addresses.email)))
  )`);
  if (agent.kind === "whatsapp" || f.channel === "whatsapp")
    clauses.push(
      `(SELECT c.status FROM whatsapp_consent_event c WHERE c."leadId"=l.id AND c."businessId"=l."businessId" ORDER BY c."createdAt" DESC,c.id DESC LIMIT 1)='granted'`,
    );
  return { values, where: clauses.join(" AND ") };
}
export async function enqueueAudience(
  c: Pick<PoolClient, "query">,
  businessId: string,
  revisionId: string,
  agent: Agent,
  since: Date | null = null,
  ids?: string[],
) {
  const { values, where } = audienceWhere(agent, businessId, since);
  let filter = where;
  if (ids) {
    values.push(ids);
    filter += ` AND l.id=ANY($${values.length}::text[])`;
  }
  const offset = values.length;
  values.push(revisionId, agent.id);
  const r = await c.query(
    `INSERT INTO agent_execution (id,"businessId","revisionId","agentId","leadId",dedupe)
 SELECT gen_random_uuid()::text,l."businessId",$${offset + 1},$${offset + 2},l.id,'lead:'||l.id FROM lead l WHERE ${filter} AND NOT EXISTS(SELECT 1 FROM agent_execution existing WHERE existing."businessId"=l."businessId" AND existing."agentId"=$${offset + 2} AND existing.dedupe='lead:'||l.id)
 ON CONFLICT DO NOTHING RETURNING id`,
    values,
  );
  return r.rowCount ?? 0;
}
export async function publish(
  businessId: string,
  actorId: string,
  version: number,
  includeCurrent: boolean,
) {
  return transaction(async (c) => {
    const {
      rows: [w],
    } = await c.query(
      'SELECT * FROM agent_workspace WHERE "businessId"=$1 FOR UPDATE',
      [businessId],
    );
    if (!w || w.version !== version)
      throw new AgentError("VERSION_CONFLICT", 409);
    const graph = w.draft as AgentGraph;
    const id = randomUUID();
    await c.query(
      'INSERT INTO agent_revision (id,"businessId",graph,"actorId") VALUES($1,$2,$3,$4)',
      [id, businessId, JSON.stringify(graph), actorId],
    );
    // Deleted agents cannot continue dispatching under an older published graph.
    const { rows: old } = w.publishedRevisionId
      ? await c.query("SELECT graph FROM agent_revision WHERE id=$1", [
          w.publishedRevisionId,
        ])
      : { rows: [] };
    const starts: Record<string, string> = { ...w.enrollmentStarts };
    for (const a of graph.nodes) {
      const previous = (old[0]?.graph.nodes ?? []).find(
        (n: Agent) => n.id === a.id,
      );
      if (
        !starts[a.id] ||
        (!previous?.automatic && a.automatic) ||
        ((old[0]?.graph.edges ?? []).some(
          (e: AgentGraph["edges"][number]) => e.target === a.id,
        ) &&
          !graph.edges.some((e) => e.target === a.id))
      )
        starts[a.id] = new Date().toISOString();
    }
    const removed = (old[0]?.graph.nodes ?? [])
      .filter((n: Agent) => !graph.nodes.some((x) => x.id === n.id))
      .map((n: Agent) => n.id);
    await c.query(
      'UPDATE agent_workspace SET "enrollmentStarts"=$4,"publishedRevisionId"=$2,paused=false,"pausedAgentIds"=$3,"activatedAt"=COALESCE("activatedAt",now()),version=version+1,"updatedAt"=now() WHERE "businessId"=$1',
      [
        businessId,
        id,
        JSON.stringify([...new Set([...w.pausedAgentIds, ...removed])]),
        JSON.stringify(starts),
      ],
    );
    if (includeCurrent)
      for (const a of graph.nodes.filter(
        (a) =>
          a.kind !== "discovery" &&
          a.automatic &&
          !graph.edges.some((e) => e.target === a.id),
      ))
        await enqueueAudience(c, businessId, id, a);
    await event(c, businessId, null, null, "published", {
      revisionId: id,
      includeCurrent,
    });
    return id;
  });
}
export async function setPaused(
  businessId: string,
  actorId: string,
  paused: boolean,
  agentId?: string,
) {
  return transaction(async (c) => {
    const {
      rows: [w],
    } = await c.query(
      'SELECT * FROM agent_workspace WHERE "businessId"=$1 FOR UPDATE',
      [businessId],
    );
    if (!w?.publishedRevisionId) throw new AgentError("NOT_PUBLISHED", 409);
    if (agentId) {
      const {
        rows: [rev],
      } = await c.query("SELECT graph FROM agent_revision WHERE id=$1", [
        w.publishedRevisionId,
      ]);
      if (!rev.graph.nodes.some((a: Agent) => a.id === agentId))
        throw new AgentError("AGENT_NOT_FOUND", 404);
      const ids = new Set<string>(w.pausedAgentIds);
      if (paused) ids.add(agentId);
      else ids.delete(agentId);
      await c.query(
        'UPDATE agent_workspace SET "pausedAgentIds"=$2 WHERE "businessId"=$1',
        [businessId, JSON.stringify([...ids])],
      );
    } else
      await c.query(
        'UPDATE agent_workspace SET paused=$2 WHERE "businessId"=$1',
        [businessId, paused],
      );
    await event(
      c,
      businessId,
      agentId ?? null,
      null,
      paused ? "paused" : "resumed",
      { actorId },
    );
  });
}
export async function isExecutionEnabled(id: string) {
  if (process.env.AGENTS_EXECUTION_ENABLED !== "true") return false;
  const {
    rows: [r],
  } = await pool.query(
    `SELECT e."businessId",NOT w.paused AND NOT (w."pausedAgentIds" ? e."agentId") AND e.status IN ('preparing','waiting','sending') AS enabled FROM agent_execution e JOIN agent_workspace w ON w."businessId"=e."businessId" WHERE e.id=$1`,
    [id],
  );
  return r?.enabled === true && agentsEnabled(r.businessId);
}
