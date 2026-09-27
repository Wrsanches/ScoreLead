import { and, eq, exists, or, sql, type SQLWrapper } from "drizzle-orm"
import { db } from "@/lib/db"
import { business, user } from "@/lib/db/schema"
import { PLATFORM_ADMIN_ROLE } from "@/lib/business-access"
import { reportingAdminAssignments } from "./config"

// Evaluate the current database role, including when checking an existing MCP
// grant. A cached browser session or issued token must not preserve admin rights.
// The outer query must include the business table for this correlated predicate.
export function reportingAdminBusinessAccess(actorUserId: string | SQLWrapper) {
  const assignments = reportingAdminAssignments()
  if (!assignments.length) return sql`false`
  return exists(
    db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          eq(user.id, actorUserId),
          eq(user.role, PLATFORM_ADMIN_ROLE),
          or(
            ...assignments.map((assignment) =>
              and(
                eq(user.id, assignment.userId),
                eq(business.id, assignment.businessId),
              ),
            ),
          ),
        ),
      ),
  )
}

export function reportingBusinessAccess(actorUserId: string | SQLWrapper) {
  return or(
    eq(business.userId, actorUserId),
    reportingAdminBusinessAccess(actorUserId),
  )!
}
