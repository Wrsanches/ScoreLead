import { lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { reportingRateBucket } from "@/lib/db/schema"
import { ReportingError } from "./errors"
import { hashToken } from "./security"
export async function reportingRateLimit(
  key: string,
  limit: number,
  windowMs = 60000,
) {
  const now = Date.now()
  const expiresAt = new Date((Math.floor(now / windowMs) + 1) * windowMs)
  const bucket = `${hashToken(key)}:${Math.floor(now / windowMs)}`
  const [row] = await db
    .insert(reportingRateBucket)
    .values({ key: bucket, count: 1, expiresAt })
    .onConflictDoUpdate({
      target: reportingRateBucket.key,
      set: { count: sql`${reportingRateBucket.count} + 1` },
    })
    .returning({ count: reportingRateBucket.count })
  // Expired bucket removal is bounded by the expiry index, once per new bucket.
  if (row.count === 1)
    await db
      .delete(reportingRateBucket)
      .where(lt(reportingRateBucket.expiresAt, new Date(now - 3600000)))
  if (row.count > limit)
    throw new ReportingError(
      "RATE_LIMITED",
      429,
      Math.ceil((expiresAt.getTime() - now) / 1000),
    )
}
