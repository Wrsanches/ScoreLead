import { and, eq, isNull, lt, notExists } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  googleReportingCache,
  googleReportingOAuthState,
  reportingRateBucket,
  reportingMcpAuthorization,
  reportingMcpClient,
  reportingMcpGrant,
  reportingMcpToken,
} from "@/lib/db/schema"
export async function cleanupReporting() {
  const now = new Date(),
    retention = new Date(Date.now() - 86400000)
  return db.transaction(async (tx) => {
    const cache = await tx
      .delete(googleReportingCache)
      .where(lt(googleReportingCache.expiresAt, now))
      .returning({ id: googleReportingCache.key })
    await tx
      .delete(googleReportingOAuthState)
      .where(lt(googleReportingOAuthState.expiresAt, now))
    await tx
      .delete(reportingRateBucket)
      .where(lt(reportingRateBucket.expiresAt, now))
    // Keep refresh-token and used-code tombstones until the grant expires so
    // replay still revokes its token family. Expired grant deletion cascades.
    const grants = await tx
      .delete(reportingMcpGrant)
      .where(lt(reportingMcpGrant.expiresAt, retention))
      .returning({ id: reportingMcpGrant.id })
    await tx
      .delete(reportingMcpToken)
      .where(
        and(
          eq(reportingMcpToken.kind, "access"),
          lt(reportingMcpToken.expiresAt, retention),
        ),
      )
    await tx
      .delete(reportingMcpAuthorization)
      .where(
        and(
          isNull(reportingMcpAuthorization.grantId),
          lt(reportingMcpAuthorization.expiresAt, now),
        ),
      )
    const hasGrant = tx
      .select({ id: reportingMcpGrant.id })
      .from(reportingMcpGrant)
      .where(eq(reportingMcpGrant.clientId, reportingMcpClient.id))
    const hasAuthorization = tx
      .select({ id: reportingMcpAuthorization.id })
      .from(reportingMcpAuthorization)
      .where(eq(reportingMcpAuthorization.clientId, reportingMcpClient.id))
    const clients = await tx
      .delete(reportingMcpClient)
      .where(
        and(
          lt(reportingMcpClient.createdAt, retention),
          notExists(hasGrant),
          notExists(hasAuthorization),
        ),
      )
      .returning({ id: reportingMcpClient.id })
    return {
      expiredReports: cache.length,
      expiredGrants: grants.length,
      unusedClients: clients.length,
    }
  })
}
