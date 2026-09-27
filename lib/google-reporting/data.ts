import { randomUUID } from "node:crypto"
import { and, eq, gt, inArray, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  googleReportingConnection as connection,
  googleReportingResource as resource,
  googleReportingOAuthState as oauthState,
  googleReportingCache as cache,
  user,
  type GoogleReportingProvider,
} from "@/lib/db/schema"
import { PLATFORM_ADMIN_ROLE } from "@/lib/business-access"
import { GOOGLE_REPORTING_SCOPES } from "./config"
import {
  decryptReportingToken,
  encryptReportingToken,
  hashToken,
  opaqueToken,
} from "./security"
import { ReportingError } from "./errors"
import {
  googleAuthorizationUrl,
  listGoogleResources,
  refreshGoogleToken,
  type GoogleTokens,
} from "./api"
import { reportingRateLimit } from "./rate-limit"

type Connection = typeof connection.$inferSelect
export const credentialContext = (
  c: Pick<Connection, "businessId" | "provider" | "subject">,
) => `${c.businessId}:${c.provider}:${c.subject}`
export async function beginGoogleConnection(
  userId: string,
  businessId: string,
  provider: GoogleReportingProvider,
  locale: string,
) {
  await reportingRateLimit(`google-connect:${userId}`, 10)
  const state = opaqueToken(),
    verifier = opaqueToken()
  await db.delete(oauthState).where(lt(oauthState.expiresAt, new Date()))
  await db.insert(oauthState).values({
    hash: hashToken(state),
    userId,
    businessId,
    provider,
    locale,
    verifierEncrypted: encryptReportingToken(verifier, state),
    expiresAt: new Date(Date.now() + 600000),
  })
  return googleAuthorizationUrl(provider, state, verifier)
}
export async function consumeGoogleState(state: string, userId: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(state))
    throw new ReportingError("INVALID_OAUTH_STATE")
  const [pending] = await db
    .delete(oauthState)
    .where(
      and(
        eq(oauthState.hash, hashToken(state)),
        eq(oauthState.userId, userId),
        gt(oauthState.expiresAt, new Date()),
      ),
    )
    .returning()
  if (!pending) throw new ReportingError("INVALID_OAUTH_STATE")
  return {
    ...pending,
    verifier: decryptReportingToken(pending.verifierEncrypted, state),
  }
}
export async function saveGoogleConnection(input: {
  businessId: string
  userId: string
  provider: GoogleReportingProvider
  subject: string
  email: string
  tokens: GoogleTokens
}) {
  const context = credentialContext(input)
  await db.transaction(async (tx) => {
    // Serialize reconnects for the same Google identity across processes.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${context}, 0))`,
    )
    const [existing] = await tx
      .select()
      .from(connection)
      .where(
        and(
          eq(connection.businessId, input.businessId),
          eq(connection.provider, input.provider),
          eq(connection.subject, input.subject),
        ),
      )
      .for("update")
    if (!input.tokens.refresh_token && !existing)
      throw new ReportingError("GOOGLE_OFFLINE_ACCESS_REQUIRED", 400)
    const values = {
      connectedBy: input.userId,
      email: input.email,
      accessTokenEncrypted: encryptReportingToken(
        input.tokens.access_token,
        context,
      ),
      refreshTokenEncrypted: input.tokens.refresh_token
        ? encryptReportingToken(input.tokens.refresh_token, context)
        : existing!.refreshTokenEncrypted,
      tokenExpiresAt: new Date(Date.now() + input.tokens.expires_in * 1000),
      scopes: input.tokens.scope!.split(" "),
      status: "connected" as const,
      lastError: null,
      updatedAt: new Date(),
    }
    if (existing)
      await tx
        .update(connection)
        .set(values)
        .where(eq(connection.id, existing.id))
    else
      await tx.insert(connection).values({
        id: randomUUID(),
        businessId: input.businessId,
        provider: input.provider,
        subject: input.subject,
        ...values,
      })
  })
}
export async function getGoogleConnection(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(connection)
    .where(and(eq(connection.id, id), eq(connection.businessId, businessId)))
    .limit(1)
  if (!row) throw new ReportingError("CONNECTION_NOT_FOUND", 404)
  return row
}
export async function getGoogleAccessToken(
  businessId: string,
  id: string,
  rejectedToken?: string,
): Promise<string> {
  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(connection)
      .where(and(eq(connection.id, id), eq(connection.businessId, businessId)))
      .for("update")
    if (!row) return new ReportingError("CONNECTION_NOT_FOUND", 404)
    if (row.status === "reconnect")
      return new ReportingError("GOOGLE_RECONNECT_REQUIRED", 401)
    const context = credentialContext(row)
    const current = decryptReportingToken(row.accessTokenEncrypted, context)
    // A concurrent caller may have already refreshed the rejected token.
    if (
      row.tokenExpiresAt.getTime() > Date.now() + 60000 &&
      (!rejectedToken || current !== rejectedToken)
    )
      return current
    try {
      const tokens = await refreshGoogleToken(
        decryptReportingToken(row.refreshTokenEncrypted, context),
      )
      if (
        tokens.scope &&
        !tokens.scope.split(" ").includes(GOOGLE_REPORTING_SCOPES[row.provider])
      )
        throw new ReportingError("GOOGLE_RECONNECT_REQUIRED", 401)
      await tx
        .update(connection)
        .set({
          accessTokenEncrypted: encryptReportingToken(
            tokens.access_token,
            context,
          ),
          ...(tokens.refresh_token
            ? {
                refreshTokenEncrypted: encryptReportingToken(
                  tokens.refresh_token,
                  context,
                ),
              }
            : {}),
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          lastError: null,
        })
        .where(eq(connection.id, id))
      return tokens.access_token
    } catch (error) {
      if (
        error instanceof ReportingError &&
        error.code === "GOOGLE_RECONNECT_REQUIRED"
      )
        await tx
          .update(connection)
          .set({ status: "reconnect", lastError: error.code })
          .where(eq(connection.id, id))
      return error instanceof ReportingError
        ? error
        : new ReportingError("GOOGLE_UNAVAILABLE", 502)
    }
  })
  if (result instanceof Error) throw result
  return result
}
export async function withGoogleAccess<T>(
  businessId: string,
  id: string,
  fn: (token: string) => Promise<T>,
): Promise<T> {
  await reportingRateLimit(`google-report:${businessId}`, 60)
  let token = await getGoogleAccessToken(businessId, id)
  try {
    let result: T
    try {
      result = await fn(token)
    } catch (error) {
      if (
        !(error instanceof ReportingError) ||
        error.code !== "GOOGLE_RECONNECT_REQUIRED"
      )
        throw error
      token = await getGoogleAccessToken(businessId, id, token)
      result = await fn(token)
    }
    await db
      .update(connection)
      .set({ lastCheckedAt: new Date(), lastError: null })
      .where(and(eq(connection.id, id), eq(connection.businessId, businessId)))
    return result
  } catch (error) {
    if (error instanceof ReportingError)
      await db
        .update(connection)
        .set({
          lastError: error.code,
          ...(error.code === "GOOGLE_RECONNECT_REQUIRED"
            ? { status: "reconnect" as const }
            : {}),
        })
        .where(
          and(eq(connection.id, id), eq(connection.businessId, businessId)),
        )
    throw error
  }
}
export async function discoverGoogleResources(
  businessId: string,
  id: string,
  actorUserId: string,
) {
  const row = await getGoogleConnection(businessId, id)
  if (row.connectedBy !== actorUserId) {
    const [actor] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, actorUserId))
      .limit(1)
    if (actor?.role !== PLATFORM_ADMIN_ROLE) {
      // A shared agency identity may contain other clients' properties. Business
      // owners can keep/remove its selected properties, but cannot discover or add
      // more without the connecting actor or a current platform admin.
      return db
        .select({ externalId: resource.externalId, name: resource.name })
        .from(resource)
        .where(and(eq(resource.connectionId, id), eq(resource.selected, true)))
    }
  }
  return withGoogleAccess(businessId, id, (token) =>
    listGoogleResources(row.provider, token),
  )
}
export async function selectGoogleResources(
  businessId: string,
  id: string,
  externalIds: string[],
  version: string,
  actorUserId: string,
) {
  const available = externalIds.length
    ? await discoverGoogleResources(businessId, id, actorUserId)
    : []
  const names = new Map(available.map((item) => [item.externalId, item.name]))
  if (externalIds.some((key) => !names.has(key)))
    throw new ReportingError("GOOGLE_RESOURCE_NOT_FOUND", 400)
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(connection)
      .where(and(eq(connection.id, id), eq(connection.businessId, businessId)))
      .for("update")
    if (!row) throw new ReportingError("CONNECTION_NOT_FOUND", 404)
    if (row.updatedAt.toISOString() !== version)
      throw new ReportingError("CONNECTION_CHANGED", 409)
    const now = new Date()
    await tx
      .update(resource)
      .set({ selected: false, updatedAt: now })
      .where(eq(resource.connectionId, id))
    for (const externalId of externalIds)
      await tx
        .insert(resource)
        .values({
          id: randomUUID(),
          connectionId: id,
          externalId,
          name: names.get(externalId)!,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [resource.connectionId, resource.externalId],
          set: { selected: true, name: names.get(externalId)!, updatedAt: now },
        })
    await tx
      .update(connection)
      .set({ updatedAt: now })
      .where(eq(connection.id, id))
  })
}
export async function reportingConnections(businessId: string) {
  const rows = await db
    .select()
    .from(connection)
    .where(eq(connection.businessId, businessId))
  const resources = rows.length
    ? await db
        .select()
        .from(resource)
        .where(
          inArray(
            resource.connectionId,
            rows.map((r) => r.id),
          ),
        )
    : []
  return rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    email: row.email,
    status: row.status,
    lastError: row.lastError,
    lastCheckedAt: row.lastCheckedAt,
    updatedAt: row.updatedAt,
    resources: resources
      .filter((r) => r.connectionId === row.id && r.selected)
      .map((r) => ({ id: r.id, externalId: r.externalId, name: r.name })),
  }))
}
export async function disconnectGoogle(businessId: string, id: string) {
  // Local deletion immediately removes credentials, selected resources and cache.
  // Do not revoke the shared Google grant: it may serve another business/provider.
  await db
    .delete(connection)
    .where(and(eq(connection.id, id), eq(connection.businessId, businessId)))
}
export async function selectedResource(businessId: string, resourceId: string) {
  const [row] = await db
    .select({ resource, connection })
    .from(resource)
    .innerJoin(connection, eq(resource.connectionId, connection.id))
    .where(
      and(
        eq(resource.id, resourceId),
        eq(resource.selected, true),
        eq(connection.businessId, businessId),
      ),
    )
    .limit(1)
  if (!row) throw new ReportingError("RESOURCE_NOT_AUTHORIZED", 403)
  if (row.connection.status !== "connected")
    throw new ReportingError("GOOGLE_RECONNECT_REQUIRED", 401)
  return row
}
export async function cachedReport(
  businessId: string,
  resourceId: string,
  query: unknown,
  run: (
    row: Awaited<ReturnType<typeof selectedResource>>,
  ) => Promise<Record<string, unknown>>,
) {
  const row = await selectedResource(businessId, resourceId)
  const key = hashToken(
    JSON.stringify([
      businessId,
      resourceId,
      row.resource.updatedAt,
      row.connection.updatedAt,
      query,
    ]),
  )
  const [cached] = await db
    .select()
    .from(cache)
    .where(and(eq(cache.key, key), gt(cache.expiresAt, new Date())))
    .limit(1)
  if (cached)
    return {
      ...cached.payload,
      freshness: {
        fetchedAt: cached.fetchedAt.toISOString(),
        cached: true,
        cacheExpiresAt: cached.expiresAt.toISOString(),
      },
    }
  const payload = await run(row)
  // Re-check after upstream I/O: disconnect/deselection during a report fails closed.
  const current = await selectedResource(businessId, resourceId)
  if (
    current.resource.updatedAt.getTime() !== row.resource.updatedAt.getTime() ||
    current.connection.updatedAt.getTime() !==
      row.connection.updatedAt.getTime()
  )
    throw new ReportingError("CONNECTION_CHANGED", 409)
  const fetchedAt = new Date(),
    expiresAt = new Date(Date.now() + 300000)
  await db
    .insert(cache)
    .values({ key, resourceId, payload, fetchedAt, expiresAt })
    .onConflictDoUpdate({
      target: cache.key,
      set: { payload, fetchedAt, expiresAt },
    })
  await db.delete(cache).where(lt(cache.expiresAt, new Date()))
  return {
    ...payload,
    freshness: {
      fetchedAt: fetchedAt.toISOString(),
      cached: false,
      cacheExpiresAt: expiresAt.toISOString(),
    },
  }
}
