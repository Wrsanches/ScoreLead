import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  expect,
  test,
} from "bun:test";
import { randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { serializeSignedCookie } from "better-call";
import { newAgent, type Agent, type AgentGraph } from "./model";
const database = process.env.AGENTS_TEST_DATABASE_URL;
if (!database)
  throw new Error(
    "Set AGENTS_TEST_DATABASE_URL to a local scorelead_agents_test* database",
  );
const u = new URL(database);
if (
  !["localhost", "127.0.0.1"].includes(u.hostname) ||
  !/^\/scorelead_agents_test\w*$/.test(u.pathname)
)
  throw new Error("Refusing non-test database");
u.searchParams.set("options", "-c timezone=UTC");
process.env.DATABASE_URL = u.toString();
process.env.BETTER_AUTH_URL = "http://localhost:3333";
process.env.BETTER_AUTH_SECRET = "agents-test-only-secret-not-production-12345";
process.env.RESEND_TOKEN_ENCRYPTION_KEY = "ab".repeat(32);
process.env.AGENTS_EXECUTION_ENABLED = "true";
process.env.STRIPE_SECRET_KEY = "";
let pool: typeof import("@/lib/db").pool,
  db: typeof import("@/lib/db").db,
  store: typeof import("./store"),
  worker: typeof import("./worker"),
  context: typeof import("./context"),
  route: typeof import("@/app/api/businesses/[id]/agents/route"),
  reserve: typeof import("./reservations").reserveUsage;
let owner: string,
  other: string,
  business: string,
  foreign: string,
  lead: string,
  job: string,
  cookie: string;
const realFetch = globalThis.fetch;
const allDay = {
  timezone: "UTC",
  timezoneConfirmed: true,
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  start: "00:00",
  end: "23:59",
  dailyLimit: 20,
  cadence: "off" as const,
};
function agent(kind: Agent["kind"] = "stage") {
  return { ...newAgent(kind, kind), schedule: allDay } as Agent;
}
async function published(a: Agent, extra: Agent[] = []) {
  const g: AgentGraph = { nodes: [a, ...extra], edges: [] };
  const w = await store.workspace(business);
  await store.saveDraft(business, g, w.version);
  return store.publish(business, owner, w.version + 1, false);
}
async function queue(a: Agent, prepared = false) {
  const rev = await published(a);
  const id = (await store.enqueue(
    pool,
    business,
    rev,
    a.id,
    a.kind === "discovery" ? null : lead,
    "lead:" + lead,
  ))!;
  if (prepared)
    await pool.query("UPDATE agent_execution SET prepared=$2 WHERE id=$1", [
      id,
      JSON.stringify({
        subject: "Hello",
        body: "Test message",
        to: "recipient@example.com",
        statusRevision: 0,
        originalStatus: "new",
      }),
    ]);
  return id;
}
async function execution(id: string) {
  return (await pool.query("SELECT * FROM agent_execution WHERE id=$1", [id]))
    .rows[0];
}
async function stage() {
  return (
    await pool.query('SELECT status,"statusRevision" FROM lead WHERE id=$1', [
      lead,
    ])
  ).rows[0];
}
function request(method: string, body?: unknown, id = business) {
  return new Request(`http://localhost:3333/api/businesses/${id}/agents`, {
    method,
    headers: {
      cookie,
      origin: "http://localhost:3333",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
beforeAll(async () => {
  ({ pool, db } = await import("@/lib/db"));
  await migrate(db, { migrationsFolder: "drizzle" });
  store = await import("./store");
  worker = await import("./worker");
  context = await import("./context");
  route = await import("@/app/api/businesses/[id]/agents/route");
  reserve = (await import("./reservations")).reserveUsage;
});
beforeEach(async () => {
  await pool.query('TRUNCATE "user" CASCADE');
  owner = randomUUID();
  other = randomUUID();
  business = randomUUID();
  foreign = randomUUID();
  lead = randomUUID();
  job = randomUUID();
  await pool.query(
    "INSERT INTO \"user\"(id,name,email) VALUES($1,'Owner',$2),($3,'Other',$4)",
    [owner, owner + "@example.com", other, other + "@example.com"],
  );
  await pool.query(
    "INSERT INTO subscription(id,plan,\"referenceId\",status) VALUES($1,'growth',$2,'active')",
    [randomUUID(), owner],
  );
  await pool.query(
    "INSERT INTO business(id,\"userId\",name,\"onboardingCompleted\") VALUES($1,$2,'Demo',true),($3,$4,'Other',true)",
    [business, owner, foreign, other],
  );
  await pool.query(
    `INSERT INTO discovery_job(id,"businessId","userId",name,country,location,keywords,"maxResults","serviceArea") VALUES($1,$2,$3,'Test search','Brazil','São Paulo','["shops"]',20,'local')`,
    [job, business, owner],
  );
  await pool.query(
    "INSERT INTO lead(id,\"businessId\",\"jobId\",name,email,score,source) VALUES($1,$2,$3,'Test lead','recipient@example.com',8,'manual')",
    [lead, business, job],
  );
  const token = randomUUID();
  await pool.query(
    'INSERT INTO session(id,"userId",token,"expiresAt") VALUES($1,$2,$3,now()+interval \'1 day\')',
    [randomUUID(), owner, token],
  );
  cookie = (
    await serializeSignedCookie(
      "better-auth.session_token",
      token,
      process.env.BETTER_AUTH_SECRET!,
    )
  ).split(";")[0];
  const encrypted = (await import("@/lib/resend/security")).encryptResendSecret(
    "re_simulated",
    business,
  );
  await pool.query(
    'INSERT INTO resend_connection(id,"businessId","apiKeyEncrypted","fromName","fromEmail","domainStatus") VALUES($1,$2,$3,\'Demo\',\'sender@example.com\',\'verified\')',
    [randomUUID(), business, encrypted],
  );
  process.env.AGENTS_EXECUTION_ENABLED = "true";
  globalThis.fetch = (() => {
    throw new Error("Unexpected external request");
  }) as unknown as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});
afterAll(async () => {
  await pool.end();
});
test("tenant auth, rejected foreign leads and stale draft writes", async () => {
  expect(
    (
      await route.GET(request("GET", undefined, foreign), {
        params: Promise.resolve({ id: foreign }),
      })
    ).status,
  ).toBe(403);
  await expect(context.leadContext(foreign, lead)).rejects.toThrow(
    "LEAD_NOT_FOUND",
  );
  await store.saveDraft(business, { nodes: [agent()], edges: [] }, 0);
  await expect(
    store.saveDraft(business, { nodes: [], edges: [] }, 0),
  ).rejects.toThrow("VERSION_CONFLICT");
});
test("simultaneous manual and automatic enrollment creates one durable execution", async () => {
  const a = { ...agent(), automatic: true };
  const rev = await published(a);
  await Promise.all([
    store.enqueueAudience(pool, business, rev, a),
    store.enqueueAudience(pool, business, rev, a, null, [lead]),
    store.enqueue(pool, business, rev, a.id, lead, "lead:" + lead),
  ]);
  expect(
    (await pool.query("SELECT count(*)::int n FROM agent_execution")).rows[0].n,
  ).toBe(1);
  await Promise.all([worker.pumpAgents(), worker.pumpAgents()]);
  expect((await stage()).status).toBe("contacted");
  expect(
    (await pool.query("SELECT status FROM agent_execution")).rows[0].status,
  ).toBe("succeeded");
});
test("published versions are immutable; pause and destination pause block work", async () => {
  const a = agent();
  const id = await queue(a);
  const w = await store.workspace(business);
  await store.saveDraft(
    business,
    {
      nodes: [{ ...a, kind: "stage", from: "new", to: "customer" }],
      edges: [],
    },
    w.version,
  );
  await store.publish(business, owner, w.version + 1, false);
  await store.setPaused(business, owner, true, a.id);
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("queued");
  await store.setPaused(business, owner, false, a.id);
  await worker.pumpAgents();
  expect((await stage()).status).toBe("contacted");
});
test("recovery requeues pre-send failures, but marks uncertain sends for review", async () => {
  const a = agent("email");
  const id = await queue(a, true);
  await pool.query(
    "UPDATE agent_execution SET status='preparing',lease=$2,\"updatedAt\"=now()-interval '11 minutes' WHERE id=$1",
    [id, randomUUID()],
  );
  await worker.recoverExecutions();
  expect((await execution(id)).status).toBe("queued");
  await pool.query(
    "UPDATE agent_execution SET status='sending',\"requestStartedAt\"=now(),\"updatedAt\"=now()-interval '11 minutes' WHERE id=$1",
    [id],
  );
  await worker.recoverExecutions();
  expect((await execution(id)).status).toBe("needs_review");
  await worker.pumpAgents();
  expect((await stage()).status).toBe("new");
});
test("email uses stable idempotency and updates contacted only after acceptance", async () => {
  const a = agent("email");
  const id = await queue(a, true);
  let calls = 0;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    expect(String(url)).toContain("api.resend.com/emails");
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe(
      "scorelead/" + id,
    );
    expect((await stage()).status).toBe("new");
    calls++;
    return Response.json({ id: "simulated-provider-id" });
  }) as unknown as typeof fetch;
  await worker.pumpAgents();
  await worker.pumpAgents();
  expect(calls).toBe(1);
  expect((await execution(id)).status).toBe("succeeded");
  expect((await stage()).status).toBe("contacted");
});
test("manual status edits during provider request are preserved", async () => {
  const id = await queue(agent("email"), true);
  globalThis.fetch = (async () => {
    await pool.query("UPDATE lead SET status='customer' WHERE id=$1", [lead]);
    return Response.json({ id: "simulated" });
  }) as unknown as typeof fetch;
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("succeeded");
  expect((await stage()).status).toBe("customer");
});
test("ambiguous provider result never retries automatically or advances stage", async () => {
  const id = await queue(agent("email"), true);
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error("Connection closed after send");
  }) as unknown as typeof fetch;
  await worker.pumpAgents();
  await worker.pumpAgents();
  expect(calls).toBe(1);
  expect((await execution(id)).status).toBe("needs_review");
  expect((await stage()).status).toBe("new");
  const r = await route.POST(
    request("POST", { action: "retry", executionId: id }),
    { params: Promise.resolve({ id: business }) },
  );
  expect(r.status).toBe(409);
});
test("suppression and disconnected provider prevent dispatch", async () => {
  const id = await queue(agent("email"), true);
  await pool.query(
    "INSERT INTO email_suppression(id,\"businessId\",email,reason) VALUES($1,$2,'recipient@example.com','unsubscribe')",
    [randomUUID(), business],
  );
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("skipped");
  expect((await stage()).status).toBe("new");
});
test("plan reservation atomic under retries and last-credit competition", async () => {
  const a = agent("email"),
    id = await queue(a, true),
    e = await worker.claimExecution();
  expect(e?.id).toBe(id);
  await Promise.all([
    reserve(id, e!.lease!, owner, "outreachMessages"),
    reserve(id, e!.lease!, owner, "outreachMessages"),
  ]);
  expect(
    (await pool.query('SELECT "outreachMessages" n FROM usage')).rows[0].n,
  ).toBe(1);
  await pool.query('UPDATE usage SET "outreachMessagesMonth"=200');
  await pool.query(
    'UPDATE agent_execution SET "usageReserved"=false WHERE id=$1',
    [id],
  );
  await expect(
    reserve(id, e!.lease!, owner, "outreachMessages"),
  ).rejects.toThrow("Plan limit");
});
test("new automatic agents do not enroll historical leads unless explicitly included", async () => {
  await pool.query(
    "UPDATE lead SET \"createdAt\"=now()-interval '1 hour' WHERE id=$1",
    [lead],
  );
  const a = { ...agent(), automatic: true };
  await published(a);
  await worker.scheduleAgents();
  expect(
    (await pool.query("SELECT count(*)::int n FROM agent_execution")).rows[0].n,
  ).toBe(0);
  const w = await store.workspace(business);
  await store.publish(business, owner, w.version, true);
  expect(
    (await pool.query("SELECT count(*)::int n FROM agent_execution")).rows[0].n,
  ).toBe(1);
});
test("disabled execution, cancellation, and no re-enrollment after cancellation", async () => {
  const id = await queue(agent());
  process.env.AGENTS_EXECUTION_ENABLED = "false";
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("queued");
  expect(
    (
      await route.POST(request("POST", { action: "cancel", executionId: id }), {
        params: Promise.resolve({ id: business }),
      })
    ).status,
  ).toBe(200);
  process.env.AGENTS_EXECUTION_ENABLED = "true";
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("cancelled");
  expect((await stage()).status).toBe("new");
});
test("timezone schedules recover only current slot, no unbounded catchup", () => {
  const a = agent("discovery");
  a.schedule = {
    ...allDay,
    timezone: "America/New_York",
    start: "09:00",
    end: "17:00",
    weekdays: [1, 2, 3, 4, 5],
    cadence: "daily",
  };
  expect(worker.scheduleSlot(a, new Date("2026-03-09T13:00:00Z"))).toBe(
    "2026-3-9",
  );
  expect(worker.scheduleSlot(a, new Date("2026-03-09T12:59:00Z"))).toBeNull();
  expect(worker.scheduleSlot(a, new Date("2026-03-08T14:00:00Z"))).toBeNull();
  a.schedule.cadence = "weekly";
  expect(worker.scheduleSlot(a, new Date("2026-03-10T14:00:00Z"))).toBeNull();
});

async function whatsappFixture(consent = true) {
  process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "cd".repeat(32);
  process.env.META_APP_SECRET = "test-meta-secret";
  const token = (await import("@/lib/whatsapp/security")).encryptWhatsAppToken(
    "test-token",
  );
  const connection = randomUUID(),
    template = randomUUID(),
    components = [{ type: "BODY", text: "Olá! Teste controlado." }];
  await pool.query(
    `INSERT INTO whatsapp_connection(id,"businessId","wabaId","phoneNumberId","encryptedAccessToken",timezone,"allowedWeekdays","sendWindowStart","sendWindowEnd") VALUES($1,$2,'test-waba',$3,$4,'UTC','[0,1,2,3,4,5,6]','00:00','23:59')`,
    [connection, business, randomUUID(), token],
  );
  await pool.query(
    `INSERT INTO whatsapp_template(id,"connectionId","metaTemplateId",name,language,category,status,components,supported) VALUES($1,$2,'test-template','hello','pt_BR','MARKETING','APPROVED',$3,true)`,
    [template, connection, JSON.stringify(components)],
  );
  if (consent)
    await pool.query(
      `INSERT INTO whatsapp_consent_event(id,"businessId","leadId","phoneE164",status,source,"capturedAt") VALUES($1,$2,$3,'+5511999999999','granted','test',now())`,
      [randomUUID(), business, lead],
    );
  const a = agent("whatsapp") as Extract<Agent, { kind: "whatsapp" }>;
  a.templateId = template;
  a.instructions = "Say hello";
  const id = await queue(a);
  await pool.query("UPDATE agent_execution SET prepared=$2 WHERE id=$1", [
    id,
    JSON.stringify({
      template: {
        metaTemplateId: "test-template",
        name: "hello",
        language: "pt_BR",
        components,
      },
      parameters: [],
      body: "Olá! Teste controlado.",
      to: "+5511999999999",
      statusRevision: 0,
      originalStatus: "new",
    }),
  ]);
  return { id, a, connection, template };
}
test("WhatsApp queues once; pause holds delivery; provider acceptance advances stage", async () => {
  const { id, a } = await whatsappFixture();
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("waiting");
  expect((await stage()).status).toBe("new");
  const wa = await import("@/lib/jobs/whatsapp-queue");
  await store.setPaused(business, owner, true, a.id);
  await wa.processWhatsAppQueue();
  expect((await stage()).status).toBe("new");
  await store.setPaused(business, owner, false, a.id);
  await pool.query('UPDATE whatsapp_sequence_step SET "retryAt"=NULL');
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return Response.json({ messages: [{ id: "wamid.test" }] });
  }) as unknown as typeof fetch;
  await wa.processWhatsAppQueue();
  await worker.reconcileWaiting();
  await worker.pumpAgents();
  expect(calls).toBe(1);
  expect((await execution(id)).status).toBe("succeeded");
  expect((await stage()).status).toBe("contacted");
});
test("WhatsApp missing consent never queues a provider action", async () => {
  const { id } = await whatsappFixture(false);
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("skipped");
  expect(
    (await pool.query("SELECT count(*)::int n FROM whatsapp_sequence")).rows[0]
      .n,
  ).toBe(0);
});
test("WhatsApp consent revocation after queueing blocks dispatch", async () => {
  const { id } = await whatsappFixture();
  await worker.pumpAgents();
  await pool.query(
    `INSERT INTO whatsapp_consent_event(id,"businessId","leadId","phoneE164",status,source,"capturedAt") VALUES($1,$2,$3,'+5511999999999','revoked','test',now())`,
    [randomUUID(), business, lead],
  );
  await (await import("@/lib/jobs/whatsapp-queue")).processWhatsAppQueue();
  await worker.reconcileWaiting();
  expect((await execution(id)).status).toBe("skipped");
  expect((await stage()).status).toBe("new");
});
test("WhatsApp template changes after preparation are blocked at delivery", async () => {
  const { id, template } = await whatsappFixture();
  await worker.pumpAgents();
  await pool.query("UPDATE whatsapp_template SET status='PAUSED' WHERE id=$1", [
    template,
  ]);
  await (await import("@/lib/jobs/whatsapp-queue")).processWhatsAppQueue();
  await worker.reconcileWaiting();
  expect((await execution(id)).status).toBe("skipped");
  expect((await stage()).status).toBe("new");
});
test("queued email rechecks the owner plan and provider connection", async () => {
  const id = await queue(agent("email"), true);
  await pool.query("UPDATE subscription SET status='cancelled'");
  await worker.pumpAgents();
  expect((await execution(id)).result).toBe("EMAIL_UNAVAILABLE");
  expect((await stage()).status).toBe("new");
});
test("scheduled discovery deduplicates the current slot and clamps plan cap", async () => {
  const a = agent("discovery") as Extract<Agent, { kind: "discovery" }>;
  a.schedule = { ...allDay, cadence: "daily" };
  a.country = "BR";
  a.location = "São Paulo";
  a.keywords = ["shops"];
  a.maxResults = 500;
  await published(a);
  await Promise.all([worker.scheduleAgents(), worker.scheduleAgents()]);
  expect(
    (await pool.query("SELECT count(*)::int n FROM agent_execution")).rows[0].n,
  ).toBe(1);
  await worker.pumpAgents();
  const e = (await pool.query("SELECT * FROM agent_execution")).rows[0];
  expect(e.status).toBe("waiting");
  expect(
    (
      await pool.query('SELECT "maxResults" FROM discovery_job WHERE id=$1', [
        e.id,
      ])
    ).rows[0].maxResults,
  ).toBe(50);
});

test("manual batch uses the reviewed revision, rejects foreign IDs, and deduplicates all matching", async () => {
  const a = agent();
  const revisionId = await published(a);
  const body = {
    action: "run",
    agentId: a.id,
    revisionId,
    requestId: randomUUID(),
    leadIds: [lead],
  };
  const post = (b: unknown) =>
    route.POST(request("POST", b), {
      params: Promise.resolve({ id: business }),
    });
  expect((await post({ ...body, revisionId: randomUUID() })).status).toBe(409);
  expect((await post({ ...body, leadIds: [randomUUID()] })).status).toBe(404);
  expect(await (await post(body)).json()).toEqual({ count: 1 });
  expect(await (await post({ ...body, allMatching: true })).json()).toEqual({
    count: 0,
  });
});
test("waiting WhatsApp can be cancelled before dispatch", async () => {
  const { id } = await whatsappFixture();
  await worker.pumpAgents();
  const response = await route.POST(
    request("POST", { action: "cancel", executionId: id }),
    { params: Promise.resolve({ id: business }) },
  );
  expect(response.status).toBe(200);
  await (await import("@/lib/jobs/whatsapp-queue")).processWhatsAppQueue();
  expect((await execution(id)).status).toBe("cancelled");
  expect((await stage()).status).toBe("new");
});
test("manual edits made while WhatsApp waits block the stale message", async () => {
  const { id } = await whatsappFixture();
  await worker.pumpAgents();
  await pool.query("UPDATE lead SET status='new' WHERE id=$1", [lead]);
  await (await import("@/lib/jobs/whatsapp-queue")).processWhatsAppQueue();
  await worker.reconcileWaiting();
  expect((await execution(id)).status).toBe("skipped");
  expect((await stage()).status).toBe("new");
});
test("rollout allowlist isolates the enabled business", async () => {
  const a = agent();
  const id = await queue(a);
  process.env.AGENTS_ALLOWED_BUSINESS_IDS = foreign;
  try {
    await worker.pumpAgents();
    expect((await execution(id)).status).toBe("queued");
  } finally {
    delete process.env.AGENTS_ALLOWED_BUSINESS_IDS;
  }
  await worker.pumpAgents();
  expect((await execution(id)).status).toBe("succeeded");
});
test("a paused destination keeps a forwarded lead queued until resumed", async () => {
  const a = agent(),
    b = agent();
  if (b.kind !== "stage") throw new Error("Wrong fixture");
  b.from = "contacted";
  b.to = "interested";
  b.filter.status = "contacted";
  const graph: AgentGraph = {
    nodes: [a, b],
    edges: [
      {
        id: randomUUID(),
        source: a.id,
        target: b.id,
        fallback: false,
        condition: { outcome: "success", channel: "any", minScore: 0 },
      },
    ],
  };
  await store.saveDraft(business, graph, 0);
  const revision = await store.publish(business, owner, 1, false);
  await store.setPaused(business, owner, true, b.id);
  await store.enqueue(pool, business, revision, a.id, lead, `lead:${lead}`);
  await worker.pumpAgents();
  expect((await stage()).status).toBe("contacted");
  expect(
    (
      await pool.query(
        'SELECT status FROM agent_execution WHERE "agentId"=$1',
        [b.id],
      )
    ).rows[0].status,
  ).toBe("queued");
  await store.setPaused(business, owner, false, b.id);
  await worker.pumpAgents();
  expect((await stage()).status).toBe("interested");
});
