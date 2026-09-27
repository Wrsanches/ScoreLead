import { and, eq, exists, or, type SQLWrapper } from "drizzle-orm"
import { db } from "@/lib/db"
import { business, user } from "@/lib/db/schema"
import { PLATFORM_ADMIN_ROLE } from "@/lib/business-access"

// Evaluate the current database role, including when checking an existing MCP
// grant. A cached browser session or issued token must not preserve admin rights.
// The outer query must include the business table for this correlated predicate.
export function reportingBusinessAccess(actorUserId: string | SQLWrapper) {
  return exists(
    db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          eq(user.id, actorUserId),
          or(eq(user.id, business.userId), eq(user.role, PLATFORM_ADMIN_ROLE)),
        ),
      ),
  )
}
