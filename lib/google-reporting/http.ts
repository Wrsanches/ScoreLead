import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { ReportingError } from "./errors"
import { sameReportingOrigin } from "./security"
import { reportingBusinessAccess } from "./access"

export async function reportingSession(request: Request, write = false) {
  if (write && !sameReportingOrigin(request))
    throw new ReportingError("INVALID_ORIGIN", 403)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new ReportingError("UNAUTHORIZED", 401)
  return session
}
// Use the same owner/admin management policy as the rest of the dashboard.
export async function reportingAccess(
  request: Request,
  businessId: string,
  write = false,
) {
  const session = await reportingSession(request, write)
  const [allowed] = await db
    .select({ id: business.id })
    .from(business)
    .where(
      and(
        eq(business.id, businessId),
        reportingBusinessAccess(session.user.id),
      ),
    )
    .limit(1)
  if (!allowed) throw new ReportingError("BUSINESS_NOT_FOUND", 404)
  return session
}
export async function boundedText(request: Request, limit = 16384) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new ReportingError("REQUEST_TOO_LARGE", 413)
  if (!request.body) return ""
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > limit) {
        await reader.cancel()
        throw new ReportingError("REQUEST_TOO_LARGE", 413)
      }
      chunks.push(chunk.value)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks).toString("utf8")
}
export async function jsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let value: unknown
  try {
    value = JSON.parse(await boundedText(request))
  } catch (error) {
    if (error instanceof ReportingError) throw error
    throw new ReportingError("INVALID_REQUEST")
  }
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ReportingError("INVALID_REQUEST")
  return parsed.data
}
export const noStoreJson = (value: unknown) =>
  Response.json(value, { headers: { "Cache-Control": "no-store" } })
