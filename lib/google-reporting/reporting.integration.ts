/** Run only against an empty local disposable DB: see docs/google-reporting-mcp.md. */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
} from "bun:test"
import { randomUUID } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { serializeSignedCookie } from "better-call"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import {
  auth as mcpAuth,
  type OAuthClientProvider,
} from "@modelcontextprotocol/sdk/client/auth.js"
import type {
  OAuthClientInformation,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js"

const testUrl = process.env.REPORTING_TEST_DATABASE_URL
if (!testUrl)
  throw new Error(
    "Set REPORTING_TEST_DATABASE_URL to an isolated local database named scorelead_reporting_test*",
  )
const parsedUrl = new URL(testUrl)
if (
  !["localhost", "127.0.0.1"].includes(parsedUrl.hostname) ||
  !/^\/scorelead_reporting_test\w*$/.test(parsedUrl.pathname)
)
  throw new Error("Refusing to mutate a non-local or non-test database")
process.env.DATABASE_URL = testUrl
process.env.BETTER_AUTH_URL = "http://localhost:3333"
process.env.BETTER_AUTH_SECRET =
  "reporting-integration-test-only-secret-123456789"
process.env.GOOGLE_REPORTING_CLIENT_ID = "test-client"
process.env.GOOGLE_REPORTING_CLIENT_SECRET = "test-secret"
process.env.GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY = "ab".repeat(32)
process.env.STRIPE_SECRET_KEY = ""
process.env.GOOGLE_CLIENT_ID = "test-signin-client"
process.env.GOOGLE_CLIENT_SECRET = "test-signin-secret"
let db: typeof import("@/lib/db").db
let pool: typeof import("@/lib/db").pool
let schema: typeof import("@/lib/db/schema")
let data: typeof import("./data")
let reports: typeof import("./reports")
let oauth: typeof import("@/lib/mcp/oauth")
let hashToken: typeof import("./security").hashToken
let opaqueToken: typeof import("./security").opaqueToken
let pkceChallenge: typeof import("./security").pkceChallenge
let decryptReportingToken: typeof import("./security").decryptReportingToken
let reportingRateLimit: typeof import("./rate-limit").reportingRateLimit
let GOOGLE_REPORTING_SCOPES: typeof import("./config").GOOGLE_REPORTING_SCOPES
let registrationSchema: typeof import("@/lib/mcp/validation").registrationSchema
let mcpRoute: typeof import("@/app/api/mcp/route")
let connectionRoute: typeof import("@/app/api/businesses/[id]/google-reporting/route")
let startRoute: typeof import("@/app/api/businesses/[id]/google-reporting/connect/route")
let resourceRoute: typeof import("@/app/api/businesses/[id]/google-reporting/connections/[connectionId]/resources/route")
let consentRoute: typeof import("@/app/api/mcp/oauth/consent/route")
let callbackRoute: typeof import("@/app/api/google-reporting/callback/route")
let registrationRoute: typeof import("@/app/api/mcp/oauth/register/route")
let tokenRoute: typeof import("@/app/api/mcp/oauth/token/route")
let revokeRoute: typeof import("@/app/api/mcp/oauth/revoke/route")
let authRoute: typeof import("@/app/api/mcp/oauth/authorize/route")
let resourceMetadataRoute: typeof import("@/app/.well-known/oauth-protected-resource/route")
let authMetadataRoute: typeof import("@/app/.well-known/oauth-authorization-server/route")
const originalFetch = globalThis.fetch
let u1: string,
  u2: string,
  b1: string,
  b2: string,
  ga: string,
  gsc: string,
  foreign: string,
  r1: string,
  r2: string,
  r3: string,
  cookie: string
const origin = "http://localhost:3333",
  audience = `${origin}/api/mcp`
function upstream(fn: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) =>
    fn(String(url), init)) as typeof fetch
}
const read = (id: string) =>
  new Request(`${origin}/api/businesses/${id}/google-reporting`, {
    headers: { cookie },
  })
function write(url: string, body: unknown, extra: Record<string, string> = {}) {
  return new Request(`${origin}${url}`, {
    method: "POST",
    headers: { cookie, origin, "Content-Type": "application/json", ...extra },
    body: JSON.stringify(body),
  })
}
function form(url: string, body: Record<string, string>) {
  return new Request(`${origin}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  })
}
async function googleConnection(
  ownerId: string,
  businessId: string,
  provider: "ga4" | "search_console",
  subject: string,
) {
  await data.saveGoogleConnection({
    userId: ownerId,
    businessId,
    provider,
    subject,
    email: `${subject}@example.com`,
    tokens: {
      access_token: "google-access-secret",
      refresh_token: "google-refresh-secret",
      expires_in: 3600,
      token_type: "Bearer",
      scope: `openid email ${GOOGLE_REPORTING_SCOPES[provider]}`,
    },
  })
  return (await data.reportingConnections(businessId)).find(
    (c) => c.provider === provider,
  )!.id
}
function allowReportingAdmin(userId: string, businessId: string) {
  process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS = JSON.stringify([
    { userId, businessId },
  ])
}
async function authorize(ids = [r1, r2], businessId = b1) {
  const client = await oauth.registerMcpClient(
    registrationSchema.parse({
      client_name: "Test assistant",
      redirect_uris: ["http://127.0.0.1:8765/callback"],
    }),
  )
  const verifier = opaqueToken()
  const params = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0],
    response_type: "code",
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
    resource: audience,
    scope: "analytics:read offline_access",
    state: "client-state",
  })
  const requestId = await oauth.beginMcpAuthorization(params)
  const url = new URL(
    await oauth.decideMcpAuthorization({
      requestId,
      userId: u1,
      accept: true,
      businessId,
      resourceIds: ids,
    }),
  )
  const input = {
    grant_type: "authorization_code" as const,
    client_id: client.client_id,
    code: url.searchParams.get("code")!,
    redirect_uri: client.redirect_uris[0],
    code_verifier: verifier,
    resource: audience,
  }
  const tokens = await oauth.exchangeMcpToken(input)
  return {
    client,
    verifier,
    requestId,
    url,
    input,
    tokens,
    grant: await oauth.authorizeMcpToken(tokens.access_token),
  }
}
async function rpc(access: string, method: string, params?: unknown) {
  const response = await mcpRoute.POST(
    new Request(audience, {
      method: "POST",
      headers: {
        authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  )
  return { response, body: await response.json() }
}
beforeAll(async () => {
  ;({ db, pool } = await import("@/lib/db"))
  schema = await import("@/lib/db/schema")
  data = await import("./data")
  reports = await import("./reports")
  oauth = await import("@/lib/mcp/oauth")
  ;({ hashToken, opaqueToken, pkceChallenge, decryptReportingToken } =
    await import("./security"))
  ;({ reportingRateLimit } = await import("./rate-limit"))
  ;({ GOOGLE_REPORTING_SCOPES } = await import("./config"))
  ;({ registrationSchema } = await import("@/lib/mcp/validation"))
  mcpRoute = await import("@/app/api/mcp/route")
  connectionRoute =
    await import("@/app/api/businesses/[id]/google-reporting/route")
  startRoute =
    await import("@/app/api/businesses/[id]/google-reporting/connect/route")
  resourceRoute =
    await import("@/app/api/businesses/[id]/google-reporting/connections/[connectionId]/resources/route")
  consentRoute = await import("@/app/api/mcp/oauth/consent/route")
  callbackRoute = await import("@/app/api/google-reporting/callback/route")
  registrationRoute = await import("@/app/api/mcp/oauth/register/route")
  tokenRoute = await import("@/app/api/mcp/oauth/token/route")
  revokeRoute = await import("@/app/api/mcp/oauth/revoke/route")
  authRoute = await import("@/app/api/mcp/oauth/authorize/route")
  resourceMetadataRoute =
    await import("@/app/.well-known/oauth-protected-resource/route")
  authMetadataRoute =
    await import("@/app/.well-known/oauth-authorization-server/route")
  await migrate(db, { migrationsFolder: "drizzle" })
  await migrate(db, { migrationsFolder: "drizzle" })
})
beforeEach(async () => {
  delete process.env.GOOGLE_REPORTING_ALLOWED_EMAILS
  delete process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS
  await db.execute(
    sql`truncate table "user", reporting_mcp_client, reporting_rate_bucket cascade`,
  )
  u1 = randomUUID()
  u2 = randomUUID()
  b1 = randomUUID()
  b2 = randomUUID()
  r1 = randomUUID()
  r2 = randomUUID()
  r3 = randomUUID()
  await db.insert(schema.user).values([
    { id: u1, name: "Owner", email: "owner@example.com", emailVerified: true },
    { id: u2, name: "Other", email: "other@example.com", emailVerified: true },
  ])
  await db.insert(schema.business).values([
    { id: b1, userId: u1, name: "Owner business", onboardingCompleted: true },
    { id: b2, userId: u2, name: "Other business", onboardingCompleted: true },
  ])
  ga = await googleConnection(u1, b1, "ga4", "owner")
  gsc = await googleConnection(u1, b1, "search_console", "owner")
  foreign = await googleConnection(u2, b2, "ga4", "other")
  await db.insert(schema.googleReportingResource).values([
    { id: r1, connectionId: ga, externalId: "properties/123", name: "Website" },
    {
      id: r2,
      connectionId: gsc,
      externalId: "sc-domain:example.com",
      name: "Search site",
    },
    {
      id: r3,
      connectionId: foreign,
      externalId: "properties/999",
      name: "Private other tenant",
    },
  ])
  const sessionToken = opaqueToken()
  await db.insert(schema.session).values({
    id: randomUUID(),
    userId: u1,
    token: sessionToken,
    expiresAt: new Date(Date.now() + 86400000),
  })
  cookie = (
    await serializeSignedCookie(
      "better-auth.session_token",
      sessionToken,
      process.env.BETTER_AUTH_SECRET!,
    )
  ).split(";")[0]
})
afterEach(() => {
  globalThis.fetch = originalFetch
  delete process.env.GOOGLE_REPORTING_ALLOWED_EMAILS
  delete process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS
})
afterAll(async () => {
  await pool.end()
})

test("migration is repeatable and credential summaries never include tokens", async () => {
  const response = await connectionRoute.GET(read(b1), {
    params: Promise.resolve({ id: b1 }),
  })
  expect(response.status).toBe(200)
  const summary = await response.text()
  expect(summary).not.toContain("secret")
  expect(summary).not.toContain("Encrypted")
  expect(summary).toContain("properties/123")
})
test("dashboard requires an exact business assignment and a current admin role", async () => {
  expect(
    (
      await connectionRoute.GET(new Request(`${origin}/api`), {
        params: Promise.resolve({ id: b1 }),
      })
    ).status,
  ).toBe(401)
  expect(
    (
      await connectionRoute.GET(read(b2), {
        params: Promise.resolve({ id: b2 }),
      })
    ).status,
  ).toBe(404)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  expect(
    (
      await connectionRoute.GET(read(b2), {
        params: Promise.resolve({ id: b2 }),
      })
    ).status,
  ).toBe(404)
  // Different pairs must not become a cross-product of allowed actors/businesses.
  process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS = JSON.stringify([
    { userId: u1, businessId: b1 },
    { userId: u2, businessId: b2 },
  ])
  expect(
    (
      await connectionRoute.GET(read(b2), {
        params: Promise.resolve({ id: b2 }),
      })
    ).status,
  ).toBe(404)
  allowReportingAdmin(u1, b2)
  expect(
    (
      await connectionRoute.GET(read(b2), {
        params: Promise.resolve({ id: b2 }),
      })
    ).status,
  ).toBe(200)
  expect(
    (await oauth.consentBusinesses(u1)).map((entry) => entry.id).sort(),
  ).toEqual([b1, b2].sort())
  await db
    .update(schema.user)
    .set({ role: "user" })
    .where(eq(schema.user.id, u1))
  expect(
    (
      await connectionRoute.GET(read(b2), {
        params: Promise.resolve({ id: b2 }),
      })
    ).status,
  ).toBe(404)
  expect((await oauth.consentBusinesses(u1)).map((entry) => entry.id)).toEqual([
    b1,
  ])
})
test("admin Google consent is business-bound and records the connecting admin", async () => {
  allowReportingAdmin(u1, b2)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  const started = await startRoute.POST(write("/api", { provider: "ga4" }), {
    params: Promise.resolve({ id: b2 }),
  })
  expect(started.status).toBe(200)
  const state = new URL((await started.json()).url).searchParams.get("state")!
  upstream(async (url) =>
    url.includes("/token")
      ? Response.json({
          access_token: "admin-access",
          refresh_token: "admin-refresh",
          expires_in: 3600,
          scope: `openid email ${GOOGLE_REPORTING_SCOPES.ga4}`,
          token_type: "Bearer",
        })
      : Response.json({
          sub: "admin-google",
          email: "admin@example.com",
          email_verified: true,
        }),
  )
  const response = await callbackRoute.GET(
    new Request(
      `${origin}/api/google-reporting/callback?state=${state}&code=valid`,
      { headers: { cookie } },
    ),
  )
  expect(response.headers.get("location")).toContain(
    `/admin/business/${b2}/integrations/google?google=connected`,
  )
  const added = (await data.reportingConnections(b2)).find(
    (item) => item.email === "admin@example.com",
  )!
  expect(added).toBeDefined()
  expect((await data.getGoogleConnection(b2, added.id)).connectedBy).toBe(u1)
  expect(
    (await data.reportingConnections(b1)).some(
      (item) => item.email === "admin@example.com",
    ),
  ).toBe(false)
})
test("Google callback rechecks admin access after the role is removed", async () => {
  allowReportingAdmin(u1, b2)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  const started = await startRoute.POST(write("/api", { provider: "ga4" }), {
    params: Promise.resolve({ id: b2 }),
  })
  const state = new URL((await started.json()).url).searchParams.get("state")!
  await db
    .update(schema.user)
    .set({ role: "user" })
    .where(eq(schema.user.id, u1))
  let upstreamCalls = 0
  upstream(async () => {
    upstreamCalls++
    return Response.json({})
  })
  const response = await callbackRoute.GET(
    new Request(
      `${origin}/api/google-reporting/callback?state=${state}&code=valid`,
      { headers: { cookie } },
    ),
  )
  expect(response.headers.get("location")).toContain(
    "google=BUSINESS_NOT_FOUND",
  )
  expect(upstreamCalls).toBe(0)
})
test("admin assistant grants include only the chosen business and properties", async () => {
  allowReportingAdmin(u1, b2)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  await expect(authorize([r1], b2)).rejects.toThrow("RESOURCE_NOT_AUTHORIZED")
  const a = await authorize([r3], b2)
  expect(a.grant.userId).toBe(u1)
  expect(a.grant.businessId).toBe(b2)
  expect(a.grant.resourceIds).toEqual([r3])
  const listed = await rpc(a.tokens.access_token, "tools/call", {
    name: "list_connections",
    arguments: {},
  })
  expect(listed.response.status).toBe(200)
  expect(JSON.stringify(listed.body)).toContain("properties/999")
  expect(JSON.stringify(listed.body)).not.toContain("properties/123")
  const denied = await rpc(a.tokens.access_token, "tools/call", {
    name: "get_reporting_fields",
    arguments: { resourceId: r1 },
  })
  expect(JSON.stringify(denied.body)).toContain("RESOURCE_NOT_AUTHORIZED")
})
test("removing admin access blocks issued MCP tokens and refresh without affecting owned-business grants", async () => {
  allowReportingAdmin(u1, b2)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  const delegated = await authorize([r3], b2)
  const owned = await authorize()
  await db
    .update(schema.user)
    .set({ role: "user" })
    .where(eq(schema.user.id, u1))
  await expect(
    oauth.authorizeMcpToken(delegated.tokens.access_token),
  ).rejects.toThrow("invalid_token")
  await expect(
    oauth.exchangeMcpToken({
      grant_type: "refresh_token",
      client_id: delegated.client.client_id,
      refresh_token: delegated.tokens.refresh_token!,
    }),
  ).rejects.toThrow("invalid_grant")
  expect(
    (await oauth.authorizeMcpToken(owned.tokens.access_token)).businessId,
  ).toBe(b1)
})
test("removing an admin assignment blocks delegated tokens and refresh while the admin role remains", async () => {
  allowReportingAdmin(u1, b2)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  const delegated = await authorize([r3], b2)
  const owned = await authorize()
  delete process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS
  await expect(
    oauth.authorizeMcpToken(delegated.tokens.access_token),
  ).rejects.toThrow("invalid_token")
  await expect(
    oauth.exchangeMcpToken({
      grant_type: "refresh_token",
      client_id: delegated.client.client_id,
      refresh_token: delegated.tokens.refresh_token!,
    }),
  ).rejects.toThrow("invalid_grant")
  expect(
    (await oauth.authorizeMcpToken(owned.tokens.access_token)).businessId,
  ).toBe(b1)
  expect((await oauth.consentBusinesses(u1)).map((entry) => entry.id)).toEqual([
    b1,
  ])
})
test("business owners can see and revoke admin-issued grants without touching other businesses", async () => {
  allowReportingAdmin(u1, b2)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  const delegated = await authorize([r3], b2)
  const owned = await authorize()
  expect((await oauth.listMcpGrants(u2, b2)).map((g) => g.id)).toContain(
    delegated.grant.id,
  )
  expect(await oauth.listMcpGrants(u2, b1)).toEqual([])
  await oauth.revokeMcpGrant(u2, b2, owned.grant.id)
  expect((await oauth.authorizeMcpToken(owned.tokens.access_token)).id).toBe(
    owned.grant.id,
  )
  await oauth.revokeMcpGrant(u2, b2, delegated.grant.id)
  await expect(
    oauth.authorizeMcpToken(delegated.tokens.access_token),
  ).rejects.toThrow("invalid_token")
})
test("Google connect rejects CSRF and validates bounded input", async () => {
  const context = { params: Promise.resolve({ id: b1 }) }
  expect(
    (
      await startRoute.POST(
        write("/api", { provider: "ga4" }, { origin: "https://evil.test" }),
        context,
      )
    ).status,
  ).toBe(403)
  expect(
    (await startRoute.POST(write("/api", { provider: "ads" }), context)).status,
  ).toBe(400)
  expect(
    (
      await startRoute.POST(
        write("/api", { provider: "ga4", padding: "a".repeat(17000) }),
        context,
      )
    ).status,
  ).toBe(413)
})
test("preview allowlist blocks new Google consent and rechecks callbacks without preventing credential management", async () => {
  const context = { params: Promise.resolve({ id: b1 }) }
  process.env.GOOGLE_REPORTING_ALLOWED_EMAILS = "other@example.com"
  const summary = await (await connectionRoute.GET(read(b1), context)).json()
  expect(summary.enabled).toBe(false)
  expect(summary.connections).toHaveLength(2)
  expect(
    (await startRoute.POST(write("/api", { provider: "ga4" }), context)).status,
  ).toBe(503)
  process.env.GOOGLE_REPORTING_ALLOWED_EMAILS = "owner@example.com"
  const started = await startRoute.POST(
    write("/api", { provider: "ga4" }),
    context,
  )
  expect(started.status).toBe(200)
  const state = new URL((await started.json()).url).searchParams.get("state")!
  process.env.GOOGLE_REPORTING_ALLOWED_EMAILS = ""
  let calledGoogle = false
  upstream(async () => {
    calledGoogle = true
    throw new Error("Preview must block before Google token exchange")
  })
  const returned = await callbackRoute.GET(
    new Request(
      `${origin}/api/google-reporting/callback?state=${state}&code=test-code`,
      { headers: { cookie } },
    ),
  )
  expect(returned.headers.get("location")).toContain(
    "google=REPORTING_NOT_CONFIGURED",
  )
  expect(calledGoogle).toBe(false)
  await expect(data.consumeGoogleState(state, u1)).rejects.toThrow(
    "INVALID_OAUTH_STATE",
  )
})
test("Google state is user-bound, expires, and is consumed once even under concurrent callbacks", async () => {
  const url = new URL(await data.beginGoogleConnection(u1, b1, "ga4", "en")),
    state = url.searchParams.get("state")!
  await expect(data.consumeGoogleState(state, u2)).rejects.toThrow(
    "INVALID_OAUTH_STATE",
  )
  const result = await Promise.allSettled([
    data.consumeGoogleState(state, u1),
    data.consumeGoogleState(state, u1),
  ])
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1)
  const next = new URL(
    await data.beginGoogleConnection(u1, b1, "ga4", "en"),
  ).searchParams.get("state")!
  await db
    .update(schema.googleReportingOAuthState)
    .set({ expiresAt: new Date(0) })
    .where(eq(schema.googleReportingOAuthState.hash, hashToken(next)))
  await expect(data.consumeGoogleState(next, u1)).rejects.toThrow(
    "INVALID_OAUTH_STATE",
  )
})
test("Google denial consumes state and returns a localized business URL", async () => {
  const state = new URL(
    await data.beginGoogleConnection(u1, b1, "ga4", "pt"),
  ).searchParams.get("state")!
  const response = await callbackRoute.GET(
    new Request(
      `${origin}/api/google-reporting/callback?state=${state}&error=access_denied`,
      { headers: { cookie } },
    ),
  )
  expect(response.status).toBe(307)
  expect(response.headers.get("location")).toContain(
    `/pt/admin/business/${b1}/integrations/google?google=AUTH_CANCELLED`,
  )
  expect(
    (
      await callbackRoute.GET(
        new Request(
          `${origin}/api/google-reporting/callback?state=${state}&code=again`,
          { headers: { cookie } },
        ),
      )
    ).status,
  ).toBe(400)
})
test("Google callback creates the selected provider and preserves existing refresh tokens on same-account reauthorization", async () => {
  const state = new URL(
    await data.beginGoogleConnection(u1, b1, "ga4", "en"),
  ).searchParams.get("state")!
  upstream(async (url) =>
    url.includes("/token")
      ? Response.json({
          access_token: "new-access",
          expires_in: 3600,
          scope: `openid email ${GOOGLE_REPORTING_SCOPES.ga4}`,
          token_type: "Bearer",
        })
      : Response.json({
          sub: "owner",
          email: "owner@example.com",
          email_verified: true,
        }),
  )
  const result = await callbackRoute.GET(
    new Request(
      `${origin}/api/google-reporting/callback?state=${state}&code=valid`,
      { headers: { cookie } },
    ),
  )
  expect(result.headers.get("location")).toContain("google=connected")
  const row = await data.getGoogleConnection(b1, ga)
  expect(
    decryptReportingToken(
      row.refreshTokenEncrypted,
      data.credentialContext(row),
    ),
  ).toBe("google-refresh-secret")
  expect(
    (await data.reportingConnections(b1)).filter((c) => c.provider === "ga4"),
  ).toHaveLength(1)
})
test("Google refresh is single-flight across concurrent database transactions", async () => {
  await db
    .update(schema.googleReportingConnection)
    .set({ tokenExpiresAt: new Date(0) })
    .where(eq(schema.googleReportingConnection.id, ga))
  let calls = 0
  upstream(async () => {
    calls++
    return Response.json({
      access_token: "fresh-secret",
      expires_in: 3600,
      token_type: "Bearer",
    })
  })
  expect(
    await Promise.all(
      Array.from({ length: 6 }, () => data.getGoogleAccessToken(b1, ga)),
    ),
  ).toEqual(Array(6).fill("fresh-secret"))
  expect(calls).toBe(1)
})
test("invalid_grant persists reconnect status rather than rolling it back", async () => {
  await db
    .update(schema.googleReportingConnection)
    .set({ tokenExpiresAt: new Date(0) })
    .where(eq(schema.googleReportingConnection.id, ga))
  upstream(async () =>
    Response.json({ error: "invalid_grant" }, { status: 400 }),
  )
  await expect(data.getGoogleAccessToken(b1, ga)).rejects.toThrow(
    "GOOGLE_RECONNECT_REQUIRED",
  )
  expect((await data.getGoogleConnection(b1, ga)).status).toBe("reconnect")
})
test("resource selection rejects forged properties, foreign connections and stale edits", async () => {
  upstream(async () =>
    Response.json({
      accountSummaries: [
        {
          propertySummaries: [
            { property: "properties/123", displayName: "Site" },
          ],
        },
      ],
    }),
  )
  const row = await data.getGoogleConnection(b1, ga)
  await expect(
    data.selectGoogleResources(
      b1,
      ga,
      ["properties/999"],
      row.updatedAt.toISOString(),
      u1,
    ),
  ).rejects.toThrow("GOOGLE_RESOURCE_NOT_FOUND")
  await expect(data.discoverGoogleResources(b1, foreign, u1)).rejects.toThrow(
    "CONNECTION_NOT_FOUND",
  )
  await data.selectGoogleResources(
    b1,
    ga,
    ["properties/123"],
    row.updatedAt.toISOString(),
    u1,
  )
  await expect(
    data.selectGoogleResources(b1, ga, [], row.updatedAt.toISOString(), u1),
  ).rejects.toThrow("CONNECTION_CHANGED")
  const res = await resourceRoute.PUT(
    new Request(`${origin}/api`, {
      method: "PUT",
      headers: { cookie, origin, "Content-Type": "application/json" },
      body: JSON.stringify({
        externalIds: ["properties/123"],
        version: "invalid",
      }),
    }),
    { params: Promise.resolve({ id: b1, connectionId: ga }) },
  )
  expect(res.status).toBe(400)
})
test("owners cannot discover or add other clients from an admin-connected Google identity", async () => {
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u2))
  await db
    .update(schema.googleReportingConnection)
    .set({ connectedBy: u2 })
    .where(eq(schema.googleReportingConnection.id, ga))
  let googleCalls = 0
  upstream(async () => {
    googleCalls++
    return Response.json({
      accountSummaries: [
        {
          propertySummaries: [
            { property: "properties/123", displayName: "Approved website" },
            { property: "properties/999", displayName: "Another client" },
          ],
        },
      ],
    })
  })
  const context = { params: Promise.resolve({ id: b1, connectionId: ga }) }
  const visible = await resourceRoute.GET(read(b1), context)
  expect(
    (await visible.json()).resources.map(
      (r: { externalId: string }) => r.externalId,
    ),
  ).toEqual(["properties/123"])
  expect(googleCalls).toBe(0)
  const save = async (externalIds: string[]) =>
    resourceRoute.PUT(
      write("/api", {
        externalIds,
        version: (
          await data.getGoogleConnection(b1, ga)
        ).updatedAt.toISOString(),
      }),
      context,
    )
  expect((await save(["properties/123", "properties/999"])).status).toBe(400)
  expect((await save(["properties/123"])).status).toBe(200)
  expect((await save([])).status).toBe(200)
  expect((await save(["properties/123"])).status).toBe(400)
  expect(googleCalls).toBe(0)
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, u1))
  allowReportingAdmin(u1, b1)
  const managed = await resourceRoute.GET(read(b1), context)
  expect((await managed.json()).resources).toHaveLength(2)
  expect((await save(["properties/123"])).status).toBe(200)
  expect(googleCalls).toBe(2)
})
test("MCP authorization validates redirect before redirecting or saving, with no open redirect", async () => {
  const client = await oauth.registerMcpClient(
    registrationSchema.parse({
      redirect_uris: ["http://127.0.0.1:8765/callback"],
    }),
  )
  const params = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: "https://evil.test",
    response_type: "code",
    code_challenge: pkceChallenge(opaqueToken()),
    code_challenge_method: "S256",
    resource: audience,
  })
  const response = await authRoute.GET(
    new Request(`${origin}/api/mcp/oauth/authorize?${params}`),
  )
  expect(response.status).toBe(400)
  expect(response.headers.has("location")).toBe(false)
})
test("explicit consent denies another tenant and forged resource IDs", async () => {
  const a = await authorize()
  const params = new URLSearchParams({
    client_id: a.client.client_id,
    redirect_uri: a.client.redirect_uris[0],
    response_type: "code",
    code_challenge: pkceChallenge(a.verifier),
    code_challenge_method: "S256",
    resource: audience,
  })
  const id = await oauth.beginMcpAuthorization(params)
  await expect(
    oauth.decideMcpAuthorization({
      requestId: id,
      userId: u1,
      accept: true,
      businessId: b2,
      resourceIds: [r3],
    }),
  ).rejects.toThrow("BUSINESS_NOT_FOUND")
  await expect(
    oauth.decideMcpAuthorization({
      requestId: id,
      userId: u1,
      accept: true,
      businessId: b1,
      resourceIds: [r3],
    }),
  ).rejects.toThrow("RESOURCE_NOT_AUTHORIZED")
  const denied = new URL(
    await oauth.decideMcpAuthorization({
      requestId: id,
      userId: u1,
      accept: false,
    }),
  )
  expect(denied.searchParams.get("error")).toBe("access_denied")
  await expect(oauth.getMcpAuthorization(id)).rejects.toThrow(
    "AUTHORIZATION_EXPIRED",
  )
})
test("consent mutation requires a signed-in manager and same-origin request", async () => {
  expect(
    (
      await consentRoute.POST(
        write("/api", {}, { origin: "https://evil.test" }),
      )
    ).status,
  ).toBe(403)
  expect(
    (
      await consentRoute.POST(
        new Request(`${origin}/api`, {
          method: "POST",
          headers: { origin },
          body: "{}",
        }),
      )
    ).status,
  ).toBe(401)
})
test("authorization codes and access/refresh tokens are stored only as hashes", async () => {
  const a = await authorize()
  const codes = await db.select().from(schema.reportingMcpAuthorization),
    tokens = await db.select().from(schema.reportingMcpToken)
  expect(JSON.stringify(codes)).not.toContain(a.input.code)
  expect(JSON.stringify(tokens)).not.toContain(a.tokens.access_token)
  expect(JSON.stringify(tokens)).not.toContain(a.tokens.refresh_token!)
  expect(a.url.searchParams.get("state")).toBe("client-state")
  expect(a.url.searchParams.get("iss")).toBe(origin)
})
test("wrong PKCE, client, redirect and audience fail without revoking a legitimate grant", async () => {
  const a = await authorize()
  for (const input of [
    { ...a.input, code_verifier: opaqueToken() },
    { ...a.input, client_id: randomUUID() },
    { ...a.input, redirect_uri: "http://127.0.0.1:8765/evil" },
    { ...a.input, resource: "https://evil.test" },
  ])
    await expect(oauth.exchangeMcpToken(input)).rejects.toBeInstanceOf(Error)
  expect((await oauth.authorizeMcpToken(a.tokens.access_token)).id).toBe(
    a.grant.id,
  )
})
test("valid code replay revokes all tokens from the compromised grant", async () => {
  const a = await authorize()
  await expect(oauth.exchangeMcpToken(a.input)).rejects.toThrow("invalid_grant")
  await expect(oauth.authorizeMcpToken(a.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
test("refresh rotation issues new tokens; old refresh replay revokes the family", async () => {
  const a = await authorize(),
    request = {
      grant_type: "refresh_token" as const,
      client_id: a.client.client_id,
      refresh_token: a.tokens.refresh_token!,
      resource: audience,
    }
  const rotated = await oauth.exchangeMcpToken(request)
  expect(rotated.refresh_token).not.toBe(a.tokens.refresh_token)
  expect((await oauth.authorizeMcpToken(rotated.access_token)).businessId).toBe(
    b1,
  )
  await expect(oauth.exchangeMcpToken(request)).rejects.toThrow("invalid_grant")
  await expect(oauth.authorizeMcpToken(rotated.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
test("concurrent refresh replay has one winner and fails closed for the entire family", async () => {
  const a = await authorize(),
    request = {
      grant_type: "refresh_token" as const,
      client_id: a.client.client_id,
      refresh_token: a.tokens.refresh_token!,
    }
  const results = await Promise.allSettled([
    oauth.exchangeMcpToken(request),
    oauth.exchangeMcpToken(request),
  ])
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
  await expect(oauth.authorizeMcpToken(a.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
test("expired access, wrong token type, revoked grants and owner transfer fail closed", async () => {
  const a = await authorize()
  await expect(
    oauth.authorizeMcpToken(a.tokens.refresh_token!),
  ).rejects.toThrow("invalid_token")
  await db
    .update(schema.reportingMcpToken)
    .set({ expiresAt: new Date(0) })
    .where(eq(schema.reportingMcpToken.hash, hashToken(a.tokens.access_token)))
  await expect(oauth.authorizeMcpToken(a.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
  const b = await authorize()
  await db
    .update(schema.business)
    .set({ userId: u2 })
    .where(eq(schema.business.id, b1))
  await expect(oauth.authorizeMcpToken(b.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
test("revocation is immediate and reauthorization never revives old tokens", async () => {
  const a = await authorize()
  await oauth.revokeMcpGrant(u2, b1, a.grant.id)
  expect((await oauth.authorizeMcpToken(a.tokens.access_token)).id).toBe(
    a.grant.id,
  )
  await oauth.revokeMcpGrant(u1, b1, a.grant.id)
  const b = await authorize()
  expect(b.grant.id).not.toBe(a.grant.id)
  await expect(oauth.authorizeMcpToken(a.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
test("RFC7009 revocation is idempotent and bound to registered client", async () => {
  const a = await authorize()
  await oauth.revokeMcpToken(a.tokens.access_token, randomUUID())
  expect((await oauth.authorizeMcpToken(a.tokens.access_token)).id).toBe(
    a.grant.id,
  )
  for (let i = 0; i < 2; i++)
    expect(
      (
        await revokeRoute.POST(
          form("/api/mcp/oauth/revoke", {
            client_id: a.client.client_id,
            token: a.tokens.access_token,
          }),
        )
      ).status,
    ).toBe(200)
  await expect(oauth.authorizeMcpToken(a.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
test("MCP rejects anonymous, bearer-in-query, foreign origins and malformed tokens with discovery headers", async () => {
  for (const url of [
    audience,
    `${audience}?access_token=google-access-secret`,
  ]) {
    const r = await mcpRoute.GET(new Request(url))
    expect(r.status).toBe(401)
    expect(r.headers.get("WWW-Authenticate")).toContain(
      "oauth-protected-resource/api/mcp",
    )
  }
  const a = await authorize()
  expect(
    (
      await mcpRoute.GET(
        new Request(audience, {
          headers: {
            Authorization: `Bearer ${a.tokens.access_token}`,
            origin: "https://evil.test",
          },
        }),
      )
    ).status,
  ).toBe(403)
  expect(
    (
      await mcpRoute.GET(
        new Request(audience, {
          headers: { Authorization: `Bearer ${a.tokens.access_token}` },
        }),
      )
    ).status,
  ).toBe(405)
})
test("MCP SDK initializes, lists schemas and calls approved tools over stateless HTTP", async () => {
  const a = await authorize([r1])
  const transport = new StreamableHTTPClientTransport(new URL(audience), {
    requestInit: {
      headers: { Authorization: `Bearer ${a.tokens.access_token}` },
    },
    fetch: async (input, init) => {
      const req = new Request(input, init)
      return req.method === "POST" ? mcpRoute.POST(req) : mcpRoute.GET(req)
    },
  })
  const client = new Client({ name: "integration-test", version: "1" })
  await client.connect(transport)
  const tools = await client.listTools()
  expect(tools.tools).toHaveLength(5)
  expect(tools.tools.every((t) => t.annotations?.readOnlyHint)).toBe(true)
  const result = await client.callTool({
    name: "list_connections",
    arguments: {},
  })
  const text = JSON.stringify(result)
  expect(text).toContain("properties/123")
  expect(text).not.toContain("sc-domain:")
  expect(text).not.toContain("999")
  expect(text).not.toContain("secret")
  const denied = await client.callTool({
    name: "query_analytics",
    arguments: {
      resourceId: r3,
      startDate: "2026-09-01",
      endDate: "2026-09-20",
      metrics: ["sessions"],
    },
  })
  expect(denied.isError).toBe(true)
  expect(JSON.stringify(denied)).toContain("RESOURCE_NOT_AUTHORIZED")
  await client.close()
})
test("report cache keeps tenant boundaries, pagination and provider metadata", async () => {
  let calls = 0
  upstream(async (url) => {
    calls++
    return url.endsWith(":checkCompatibility")
      ? Response.json({})
      : Response.json({
          rowCount: 3,
          rows: [
            {
              dimensionValues: [{ value: "/" }],
              metricValues: [{ value: "12" }],
            },
          ],
          metadata: {
            timeZone: "America/Sao_Paulo",
            currencyCode: "BRL",
            subjectToThresholding: true,
          },
          propertyQuota: { tokensPerDay: { consumed: 2 } },
        })
  })
  const args = {
    resourceId: r1,
    startDate: "2026-09-01",
    endDate: "2026-09-20",
    metrics: ["sessions"],
    dimensions: ["landingPage"],
    limit: 1,
  }
  const first = await reports.queryAnalytics(b1, args),
    second = await reports.queryAnalytics(b1, args)
  expect(first.freshness.cached).toBe(false)
  expect(second.freshness.cached).toBe(true)
  expect(calls).toBe(2)
  expect(JSON.stringify(first)).toContain("subjectToThresholding")
  expect((first as Record<string, unknown>).pagination).toEqual({
    offset: 0,
    returnedRows: 1,
    rowCount: 3,
    nextOffset: 1,
  })
  await expect(reports.queryAnalytics(b2, args)).rejects.toThrow(
    "RESOURCE_NOT_AUTHORIZED",
  )
  expect(calls).toBe(2)
})
test("deselection prevents cache reads and later additions are not silently granted", async () => {
  const a = await authorize([r1])
  await db
    .update(schema.googleReportingResource)
    .set({ selected: false })
    .where(eq(schema.googleReportingResource.id, r1))
  const result = await rpc(a.tokens.access_token, "tools/call", {
    name: "query_analytics",
    arguments: {
      resourceId: r1,
      startDate: "2026-09-01",
      endDate: "2026-09-20",
      metrics: ["sessions"],
    },
  })
  expect(JSON.stringify(result.body)).toContain("RESOURCE_NOT_AUTHORIZED")
  const list = await rpc(a.tokens.access_token, "tools/call", {
    name: "list_connections",
    arguments: {},
  })
  expect(JSON.stringify(list.body)).not.toContain("sc-domain:")
})
test("Search Console domain URLs are encoded, metadata preserved and empty rows are not fabricated", async () => {
  upstream(async (url, init) => {
    expect(url).toContain("sites/sc-domain%3Aexample.com/searchAnalytics/query")
    expect(JSON.parse(init?.body as string).dataState).toBe("all")
    return Response.json({ metadata: { first_incomplete_date: "2026-09-20" } })
  })
  const result = await reports.querySearchConsole(b1, {
    resourceId: r2,
    startDate: "2026-09-01",
    endDate: "2026-09-20",
    dataState: "all",
  })
  expect(JSON.stringify(result)).toContain("first_incomplete_date")
  expect(JSON.stringify(result)).toContain("America/Los_Angeles")
  expect((result as Record<string, unknown>).pagination).toEqual({
    offset: 0,
    returnedRows: 0,
    nextOffset: null,
    totalRowsKnown: false,
  })
})
test("Google quota and incompatibility surface actionable errors without poisoning credentials", async () => {
  upstream(async () => Response.json({}, { status: 429 }))
  await expect(
    reports.querySearchConsole(b1, {
      resourceId: r2,
      startDate: "2026-09-01",
      endDate: "2026-09-20",
    }),
  ).rejects.toThrow("GOOGLE_QUOTA_EXCEEDED")
  expect((await data.getGoogleConnection(b1, gsc)).status).toBe("connected")
  upstream(async () =>
    Response.json({
      metricCompatibilities: [
        {
          metricMetadata: { apiName: "sessions" },
          compatibility: "INCOMPATIBLE",
        },
      ],
    }),
  )
  await expect(
    reports.queryAnalytics(b1, {
      resourceId: r1,
      startDate: "2026-09-01",
      endDate: "2026-09-20",
      metrics: ["sessions"],
    }),
  ).rejects.toThrow("INCOMPATIBLE_REPORT_FIELDS")
})
test("disconnect deletes credentials/resources/cache and prevents old authorizations reading reconnects", async () => {
  const a = await authorize([r1])
  await db.insert(schema.googleReportingCache).values({
    key: "cache",
    resourceId: r1,
    payload: {},
    expiresAt: new Date(Date.now() + 300000),
  })
  await data.disconnectGoogle(b1, ga)
  expect(await db.select().from(schema.googleReportingCache)).toHaveLength(0)
  await expect(data.selectedResource(b1, r1)).rejects.toThrow(
    "RESOURCE_NOT_AUTHORIZED",
  )
  const newId = await googleConnection(u1, b1, "ga4", "owner")
  expect(newId).not.toBe(ga)
  const list = await rpc(a.tokens.access_token, "tools/call", {
    name: "list_connections",
    arguments: {},
  })
  expect(JSON.stringify(list.body)).not.toContain("properties/123")
})
test("persistent rate limits hold under concurrent requests", async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 12 }, () => reportingRateLimit("test-parallel", 5)),
  )
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5)
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(7)
})
test("OAuth SDK discovers, dynamically registers and exchanges PKCE authorization without proprietary extensions", async () => {
  let clientInfo: OAuthClientInformation | undefined,
    tokens: OAuthTokens | undefined,
    verifier = "",
    authorizationUrl: URL | undefined
  const provider: OAuthClientProvider = {
    redirectUrl: "http://127.0.0.1:8765/callback",
    clientMetadata: {
      client_name: "SDK assistant",
      redirect_uris: ["http://127.0.0.1:8765/callback"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: "analytics:read offline_access",
    },
    clientInformation: () => clientInfo,
    saveClientInformation: (v) => {
      clientInfo = v
    },
    tokens: () => tokens,
    saveTokens: (v) => {
      tokens = v
    },
    redirectToAuthorization: (url) => {
      authorizationUrl = url
    },
    saveCodeVerifier: (v) => {
      verifier = v
    },
    codeVerifier: () => verifier,
  }
  const fetchFn = async (url: string | URL, init?: RequestInit) => {
    const request = new Request(url, init),
      path = new URL(request.url).pathname
    if (path.includes("oauth-protected-resource"))
      return resourceMetadataRoute.GET()
    if (path.includes("oauth-authorization-server"))
      return authMetadataRoute.GET()
    if (path.endsWith("/register")) return registrationRoute.POST(request)
    if (path.endsWith("/token")) return tokenRoute.POST(request)
    return new Response(null, { status: 404 })
  }
  expect(
    await mcpAuth(provider, {
      serverUrl: audience,
      resourceMetadataUrl: new URL(
        `${origin}/.well-known/oauth-protected-resource/api/mcp`,
      ),
      fetchFn,
    }),
  ).toBe("REDIRECT")
  expect(authorizationUrl).toBeDefined()
  const requestId = await oauth.beginMcpAuthorization(
    authorizationUrl!.searchParams,
  )
  const callback = new URL(
    await oauth.decideMcpAuthorization({
      requestId,
      userId: u1,
      accept: true,
      businessId: b1,
      resourceIds: [r1],
    }),
  )
  expect(
    await mcpAuth(provider, {
      serverUrl: audience,
      authorizationCode: callback.searchParams.get("code")!,
      resourceMetadataUrl: new URL(
        `${origin}/.well-known/oauth-protected-resource/api/mcp`,
      ),
      fetchFn,
    }),
  ).toBe("AUTHORIZED")
  expect(
    (await oauth.authorizeMcpToken(tokens!.access_token)).resourceIds,
  ).toEqual([r1])
})

test("registration scope and grant policy cannot be expanded during authorization", async () => {
  const client = await oauth.registerMcpClient(
    registrationSchema.parse({
      redirect_uris: ["http://127.0.0.1:8765/callback"],
      grant_types: ["authorization_code"],
      scope: "analytics:read",
    }),
  )
  const params = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0],
    response_type: "code",
    code_challenge: pkceChallenge(opaqueToken()),
    code_challenge_method: "S256",
    resource: audience,
    scope: "analytics:read offline_access",
  })
  await expect(oauth.beginMcpAuthorization(params)).rejects.toThrow(
    "invalid_scope",
  )
  params.set("scope", "analytics:read")
  expect(
    (await oauth.getMcpAuthorization(await oauth.beginMcpAuthorization(params)))
      .authorization.scope,
  ).toBe("analytics:read")
  await expect(
    oauth.registerMcpClient(
      registrationSchema.parse({
        redirect_uris: client.redirect_uris,
        grant_types: ["authorization_code"],
        scope: "analytics:read offline_access",
      }),
    ),
  ).rejects.toThrow("invalid_client_metadata")
})

test("expired consent requests and authorization codes cannot issue tokens", async () => {
  const a = await authorize(),
    verifier = opaqueToken()
  const params = new URLSearchParams({
    client_id: a.client.client_id,
    redirect_uri: a.client.redirect_uris[0],
    response_type: "code",
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
    resource: audience,
  })
  const requestId = await oauth.beginMcpAuthorization(params)
  await db
    .update(schema.reportingMcpAuthorization)
    .set({ expiresAt: new Date(0) })
    .where(eq(schema.reportingMcpAuthorization.id, requestId))
  await expect(oauth.getMcpAuthorization(requestId)).rejects.toThrow(
    "AUTHORIZATION_EXPIRED",
  )
  const second = await oauth.beginMcpAuthorization(params)
  const url = new URL(
    await oauth.decideMcpAuthorization({
      requestId: second,
      userId: u1,
      accept: true,
      businessId: b1,
      resourceIds: [r1],
    }),
  )
  await db
    .update(schema.reportingMcpAuthorization)
    .set({ codeExpiresAt: new Date(0) })
    .where(eq(schema.reportingMcpAuthorization.id, second))
  await expect(
    oauth.exchangeMcpToken({
      ...a.input,
      code: url.searchParams.get("code")!,
      code_verifier: verifier,
    }),
  ).rejects.toThrow("invalid_grant")
})

test("concurrent consent decisions produce only one approved grant", async () => {
  const a = await authorize(),
    params = new URLSearchParams({
      client_id: a.client.client_id,
      redirect_uri: a.client.redirect_uris[0],
      response_type: "code",
      code_challenge: pkceChallenge(a.verifier),
      code_challenge_method: "S256",
      resource: audience,
    })
  const requestId = await oauth.beginMcpAuthorization(params)
  const action = {
    requestId,
    userId: u1,
    accept: true,
    businessId: b1,
    resourceIds: [r1],
  }
  const results = await Promise.allSettled([
    oauth.decideMcpAuthorization(action),
    oauth.decideMcpAuthorization(action),
  ])
  expect(results.filter((v) => v.status === "fulfilled")).toHaveLength(1)
  expect(await db.select().from(schema.reportingMcpGrant)).toHaveLength(2)
})

test("Google supports multiple identities and new accounts require refresh tokens", async () => {
  await expect(
    data.saveGoogleConnection({
      userId: u1,
      businessId: b1,
      provider: "ga4",
      subject: "new",
      email: "new@example.com",
      tokens: {
        access_token: "new-token",
        expires_in: 3600,
        token_type: "Bearer",
        scope: GOOGLE_REPORTING_SCOPES.ga4,
      },
    }),
  ).rejects.toThrow("GOOGLE_OFFLINE_ACCESS_REQUIRED")
  await googleConnection(u1, b1, "ga4", "new")
  expect(
    (await data.reportingConnections(b1)).filter((c) => c.provider === "ga4"),
  ).toHaveLength(2)
})

test("an unexpected upstream 401 refreshes once and retries with the new Google token", async () => {
  const { googleJson } = await import("./api")
  let refreshCalls = 0,
    reportCalls = 0
  upstream(async (url, init) => {
    if (url.endsWith("/token")) {
      refreshCalls++
      return Response.json({
        access_token: "new-access",
        expires_in: 3600,
        token_type: "Bearer",
      })
    }
    reportCalls++
    if (reportCalls === 1) return Response.json({}, { status: 401 })
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer new-access",
    )
    return Response.json({ ok: true })
  })
  const result = await data.withGoogleAccess(b1, ga, (token) =>
    googleJson<{ ok: boolean }>(
      "https://analyticsdata.googleapis.com/report",
      token,
    ),
  )
  expect(result.ok).toBe(true)
  expect(refreshCalls).toBe(1)
  expect(reportCalls).toBe(2)
})

test("disconnect during an upstream report prevents returning or caching its data", async () => {
  upstream(async () => {
    await data.disconnectGoogle(b1, gsc)
    return Response.json({ rows: [{ clicks: 42 }] })
  })
  await expect(
    reports.querySearchConsole(b1, {
      resourceId: r2,
      startDate: "2026-09-01",
      endDate: "2026-09-20",
    }),
  ).rejects.toThrow("RESOURCE_NOT_AUTHORIZED")
  expect(await db.select().from(schema.googleReportingCache)).toHaveLength(0)
})

test("assistant revocation while a report runs withholds the completed result", async () => {
  const a = await authorize([r2])
  upstream(async () => {
    await oauth.revokeMcpGrant(u1, b1, a.grant.id)
    return Response.json({ rows: [{ clicks: 42, keys: ["private-query"] }] })
  })
  const result = await rpc(a.tokens.access_token, "tools/call", {
    name: "query_search_console",
    arguments: {
      resourceId: r2,
      startDate: "2026-09-01",
      endDate: "2026-09-20",
    },
  })
  expect(JSON.stringify(result.body)).toContain("invalid_token")
  expect(JSON.stringify(result.body)).not.toContain("private-query")
})

test("token and MCP endpoints reject duplicate form keys, wrong content type, and oversized bodies", async () => {
  expect(
    (
      await tokenRoute.POST(
        write("/api/mcp/oauth/token", { grant_type: "authorization_code" }),
      )
    ).status,
  ).toBe(415)
  const polluted = new Request(`${origin}/api/mcp/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "client_id=a&client_id=b",
  })
  expect((await tokenRoute.POST(polluted)).status).toBe(400)
  const a = await authorize()
  const response = await mcpRoute.POST(
    new Request(audience, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${a.tokens.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ payload: "x".repeat(33000) }),
    }),
  )
  expect(response.status).toBe(413)
})

test("scheduled cleanup deletes expired data but preserves active replay detection", async () => {
  const a = await authorize()
  const rotation = {
    grant_type: "refresh_token" as const,
    client_id: a.client.client_id,
    refresh_token: a.tokens.refresh_token!,
  }
  await oauth.exchangeMcpToken(rotation)
  await db.insert(schema.googleReportingCache).values({
    key: "expired",
    resourceId: r1,
    payload: {},
    expiresAt: new Date(0),
  })
  const staleClient = await oauth.registerMcpClient(
    registrationSchema.parse({
      redirect_uris: ["http://127.0.0.1:9876/callback"],
    }),
  )
  await db
    .update(schema.reportingMcpClient)
    .set({ createdAt: new Date(0) })
    .where(eq(schema.reportingMcpClient.id, staleClient.client_id))
  const { cleanupReporting } = await import("./cleanup")
  const cleaned = await cleanupReporting()
  expect(cleaned.expiredReports).toBe(1)
  expect(cleaned.unusedClients).toBe(1)
  await expect(oauth.exchangeMcpToken(rotation)).rejects.toThrow(
    "invalid_grant",
  )
  await expect(oauth.authorizeMcpToken(a.tokens.access_token)).rejects.toThrow(
    "invalid_token",
  )
})
