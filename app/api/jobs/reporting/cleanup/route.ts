import { timingSafeEqual } from "node:crypto"
import { cleanupReporting } from "@/lib/google-reporting/cleanup"
import { noStoreJson } from "@/lib/google-reporting/http"
import { reportingErrorResponse } from "@/lib/google-reporting/errors"
export const maxDuration = 60
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret)
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 })
  const actual = Buffer.from(request.headers.get("authorization") || ""),
    expected = Buffer.from(`Bearer ${secret}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 })
  try {
    return noStoreJson(await cleanupReporting())
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
