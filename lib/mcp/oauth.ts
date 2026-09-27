import { randomUUID } from "node:crypto"
import { and, eq, gt, inArray, isNull } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  business,
  googleReportingConnection as connection,
  googleReportingResource as resource,
  reportingMcpClient as client,
  reportingMcpAuthorization as authorization,
  reportingMcpGrant as grant,
  reportingMcpToken as token,
} from "@/lib/db/schema"
import { ReportingError } from "@/lib/google-reporting/errors"
import { reportingBusinessAccess } from "@/lib/google-reporting/access"
import {
  hashToken,
  opaqueToken,
  verifyPkce,
} from "@/lib/google-reporting/security"
import {
  ACCESS_TOKEN_SECONDS,
  GRANT_SECONDS,
  mcpIssuer,
  mcpResource,
  MCP_SCOPE,
} from "./config"
import {
  authorizationSchema,
  parseScopes,
  redirectMatches,
  registrationSchema,
  tokenSchema,
  uniqueParams,
} from "./validation"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
export async function registerMcpClient(
  body: z.output<typeof registrationSchema>,
) {
  const id = randomUUID()
  const scope = parseScopes(
    body.scope ||
      (body.grant_types.includes("refresh_token")
        ? `${MCP_SCOPE} offline_access`
        : MCP_SCOPE),
  )
  if (
    scope.split(" ").includes("offline_access") &&
    !body.grant_types.includes("refresh_token")
  )
    throw new ReportingError("invalid_client_metadata")
  await db.insert(client).values({
    id,
    name: body.client_name,
    redirectUris: [...new Set(body.redirect_uris)],
    scopes: scope.split(" "),
    grantTypes: body.grant_types,
  })
  return {
    client_id: id,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: body.client_name,
    redirect_uris: body.redirect_uris,
    token_endpoint_auth_method: "none",
    grant_types: body.grant_types,
    response_types: ["code"],
    scope,
  }
}
export async function beginMcpAuthorization(params: URLSearchParams) {
  const parsed = authorizationSchema.safeParse(uniqueParams(params))
  if (!parsed.success) throw new ReportingError("invalid_request")
  const input = parsed.data
  const [registered] = await db
    .select()
    .from(client)
    .where(eq(client.id, input.client_id))
    .limit(1)
  if (
    !registered ||
    !registered.redirectUris.some((uri) =>
      redirectMatches(uri, input.redirect_uri),
    )
  )
    throw new ReportingError("invalid_client")
  const scope = parseScopes(input.scope || registered.scopes.join(" "))
  if (scope.split(" ").some((value) => !registered.scopes.includes(value)))
    throw new ReportingError("invalid_scope")
  const id = opaqueToken()
  await db.insert(authorization).values({
    id,
    clientId: registered.id,
    redirectUri: input.redirect_uri,
    challenge: input.code_challenge,
    state: input.state,
    scope,
    audience: input.resource,
    expiresAt: new Date(Date.now() + 600000),
  })
  return id
}
export async function getMcpAuthorization(id: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(id))
    throw new ReportingError("invalid_request")
  const [result] = await db
    .select({ authorization, clientName: client.name })
    .from(authorization)
    .innerJoin(client, eq(authorization.clientId, client.id))
    .where(
      and(
        eq(authorization.id, id),
        gt(authorization.expiresAt, new Date()),
        isNull(authorization.decidedAt),
      ),
    )
    .limit(1)
  if (!result) throw new ReportingError("AUTHORIZATION_EXPIRED", 400)
  return result
}
export async function consentBusinesses(userId: string) {
  const rows = await db
    .select({
      businessId: business.id,
      businessName: business.name,
      resourceId: resource.id,
      resourceName: resource.name,
      provider: connection.provider,
    })
    .from(business)
    .innerJoin(connection, eq(connection.businessId, business.id))
    .innerJoin(resource, eq(resource.connectionId, connection.id))
    .where(
      and(
        reportingBusinessAccess(userId),
        eq(connection.status, "connected"),
        eq(resource.selected, true),
      ),
    )
  return rows.reduce<
    {
      id: string
      name: string
      resources: { id: string; name: string; provider: string }[]
    }[]
  >((list, row) => {
    let entry = list.find((v) => v.id === row.businessId)
    if (!entry) {
      entry = {
        id: row.businessId,
        name: row.businessName || "Business",
        resources: [],
      }
      list.push(entry)
    }
    entry.resources.push({
      id: row.resourceId,
      name: row.resourceName,
      provider: row.provider,
    })
    return list
  }, [])
}
export async function decideMcpAuthorization(input: {
  requestId: string
  userId: string
  accept: boolean
  businessId?: string
  resourceIds?: string[]
}) {
  return db.transaction(async (tx) => {
    const [pending] = await tx
      .select()
      .from(authorization)
      .where(eq(authorization.id, input.requestId))
      .for("update")
    if (
      !pending ||
      pending.decidedAt ||
      pending.expiresAt.getTime() <= Date.now()
    )
      throw new ReportingError("AUTHORIZATION_EXPIRED")
    const destination = new URL(pending.redirectUri)
    destination.searchParams.set("iss", mcpIssuer())
    if (pending.state !== null)
      destination.searchParams.set("state", pending.state)
    if (!input.accept) {
      await tx
        .update(authorization)
        .set({ decidedAt: new Date() })
        .where(eq(authorization.id, pending.id))
      destination.searchParams.set("error", "access_denied")
      return destination.toString()
    }
    const [managed] = await tx
      .select()
      .from(business)
      .where(
        and(
          eq(business.id, input.businessId || ""),
          reportingBusinessAccess(input.userId),
        ),
      )
      .for("share")
    if (!managed) throw new ReportingError("BUSINESS_NOT_FOUND", 404)
    const available = await tx
      .select({ id: resource.id })
      .from(resource)
      .innerJoin(connection, eq(resource.connectionId, connection.id))
      .where(
        and(
          eq(connection.businessId, managed.id),
          eq(connection.status, "connected"),
          eq(resource.selected, true),
        ),
      )
    const allowed = new Set(available.map((r) => r.id))
    const selected = [...new Set(input.resourceIds || [])]
    if (!selected.length || selected.some((id) => !allowed.has(id)))
      throw new ReportingError("RESOURCE_NOT_AUTHORIZED", 403)
    const grantId = randomUUID(),
      code = opaqueToken()
    await tx.insert(grant).values({
      id: grantId,
      clientId: pending.clientId,
      userId: input.userId,
      businessId: managed.id,
      resourceIds: selected,
      scope: pending.scope,
      audience: pending.audience,
      expiresAt: new Date(Date.now() + GRANT_SECONDS * 1000),
    })
    await tx
      .update(authorization)
      .set({
        decidedAt: new Date(),
        codeHash: hashToken(code),
        codeExpiresAt: new Date(Date.now() + 120000),
        grantId,
      })
      .where(eq(authorization.id, pending.id))
    destination.searchParams.set("code", code)
    return destination.toString()
  })
}
async function issueTokens(
  tx: Tx,
  authorizationGrant: typeof grant.$inferSelect,
  scope: string,
) {
  const accessToken = opaqueToken(),
    refreshToken = opaqueToken()
  const remaining = Math.floor(
    (authorizationGrant.expiresAt.getTime() - Date.now()) / 1000,
  )
  const expiresIn = Math.min(ACCESS_TOKEN_SECONDS, remaining)
  if (expiresIn <= 0) throw new ReportingError("invalid_grant")
  await tx.insert(token).values({
    hash: hashToken(accessToken),
    kind: "access",
    grantId: authorizationGrant.id,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  })
  if (scope.split(" ").includes("offline_access"))
    await tx.insert(token).values({
      hash: hashToken(refreshToken),
      kind: "refresh",
      grantId: authorizationGrant.id,
      expiresAt: authorizationGrant.expiresAt,
    })
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope,
    ...(scope.split(" ").includes("offline_access")
      ? { refresh_token: refreshToken }
      : {}),
  }
}
export async function exchangeMcpToken(input: z.output<typeof tokenSchema>) {
  if (input.resource && input.resource !== mcpResource())
    throw new ReportingError("invalid_target")
  // Errors returned from the transaction commit replay revocations before throwing.
  const result = await db.transaction(async (tx) => {
    const isCode = input.grant_type === "authorization_code"
    const [authCode] = isCode
      ? await tx
          .select()
          .from(authorization)
          .where(eq(authorization.codeHash, hashToken(input.code)))
      : []
    const [refresh] = !isCode
      ? await tx
          .select()
          .from(token)
          .where(
            and(
              eq(token.hash, hashToken(input.refresh_token)),
              eq(token.kind, "refresh"),
            ),
          )
      : []
    const grantId = authCode?.grantId || refresh?.grantId
    if (!grantId) return new ReportingError("invalid_grant")
    // Always lock grant first: exchanges, rotation and revocation use one lock order.
    const [allowed] = await tx
      .select()
      .from(grant)
      .where(eq(grant.id, grantId))
      .for("update")
    if (
      !allowed ||
      allowed.clientId !== input.client_id ||
      allowed.audience !== mcpResource() ||
      allowed.revokedAt ||
      allowed.expiresAt.getTime() <= Date.now()
    )
      return new ReportingError("invalid_grant")
    const [manager] = await tx
      .select({ id: business.id })
      .from(business)
      .where(
        and(
          eq(business.id, allowed.businessId),
          reportingBusinessAccess(allowed.userId),
        ),
      )
    if (!manager) return new ReportingError("invalid_grant")
    if (isCode) {
      const [current] = await tx
        .select()
        .from(authorization)
        .where(eq(authorization.id, authCode!.id))
        .for("update")
      if (
        current.redirectUri !== input.redirect_uri ||
        !verifyPkce(input.code_verifier, current.challenge)
      )
        return new ReportingError("invalid_grant")
      if (current.codeUsedAt) {
        await tx
          .update(grant)
          .set({ revokedAt: new Date() })
          .where(eq(grant.id, allowed.id))
        return new ReportingError("invalid_grant")
      }
      if (
        !current.codeExpiresAt ||
        current.codeExpiresAt.getTime() <= Date.now()
      )
        return new ReportingError("invalid_grant")
      await tx
        .update(authorization)
        .set({ codeUsedAt: new Date() })
        .where(eq(authorization.id, current.id))
    } else {
      const [current] = await tx
        .select()
        .from(token)
        .where(eq(token.hash, refresh!.hash))
        .for("update")
      if (current.usedAt) {
        await tx
          .update(grant)
          .set({ revokedAt: new Date() })
          .where(eq(grant.id, allowed.id))
        return new ReportingError("invalid_grant")
      }
      if (current.expiresAt.getTime() <= Date.now())
        return new ReportingError("invalid_grant")
      // This server has one read scope; reject scope changes instead of silently expanding.
      if (input.scope && parseScopes(input.scope) !== allowed.scope)
        return new ReportingError("invalid_scope")
      await tx
        .update(token)
        .set({ usedAt: new Date() })
        .where(eq(token.hash, current.hash))
    }
    return issueTokens(tx, allowed, allowed.scope)
  })
  if (result instanceof ReportingError) throw result
  return result
}
export async function authorizeMcpToken(bearer: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(bearer))
    throw new ReportingError("invalid_token", 401)
  const [result] = await db
    .select({ grant })
    .from(token)
    .innerJoin(grant, eq(token.grantId, grant.id))
    .innerJoin(business, eq(grant.businessId, business.id))
    .where(
      and(
        eq(token.hash, hashToken(bearer)),
        eq(token.kind, "access"),
        gt(token.expiresAt, new Date()),
        gt(grant.expiresAt, new Date()),
        isNull(grant.revokedAt),
        eq(grant.audience, mcpResource()),
        reportingBusinessAccess(grant.userId),
      ),
    )
    .limit(1)
  if (!result || !result.grant.scope.split(" ").includes(MCP_SCOPE))
    throw new ReportingError("invalid_token", 401)
  return result.grant
}
export async function revokeMcpToken(value: string, clientId: string) {
  const [found] = await db
    .select({ grantId: token.grantId })
    .from(token)
    .innerJoin(grant, eq(token.grantId, grant.id))
    .where(and(eq(token.hash, hashToken(value)), eq(grant.clientId, clientId)))
    .limit(1)
  if (found)
    await db
      .update(grant)
      .set({ revokedAt: new Date() })
      .where(eq(grant.id, found.grantId))
}
export async function listMcpGrants(userId: string, businessId: string) {
  return db
    .select({
      id: grant.id,
      name: client.name,
      resourceIds: grant.resourceIds,
      createdAt: grant.createdAt,
      expiresAt: grant.expiresAt,
      lastUsedAt: grant.lastUsedAt,
    })
    .from(grant)
    .innerJoin(client, eq(grant.clientId, client.id))
    .innerJoin(business, eq(grant.businessId, business.id))
    .where(
      and(
        reportingBusinessAccess(userId),
        eq(grant.businessId, businessId),
        isNull(grant.revokedAt),
        gt(grant.expiresAt, new Date()),
      ),
    )
}
export async function revokeMcpGrant(
  userId: string,
  businessId: string,
  grantId: string,
) {
  await db
    .update(grant)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(grant.id, grantId),
        eq(grant.businessId, businessId),
        inArray(
          grant.businessId,
          db
            .select({ id: business.id })
            .from(business)
            .where(reportingBusinessAccess(userId)),
        ),
      ),
    )
}
