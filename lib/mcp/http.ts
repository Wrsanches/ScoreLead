import { z } from "zod"
import { ReportingError } from "@/lib/google-reporting/errors"
import { boundedText } from "@/lib/google-reporting/http"
import { oauthCorsHeaders } from "./config"
import { uniqueParams } from "./validation"
export function oauthJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: oauthCorsHeaders })
}
export function oauthError(error: unknown) {
  const known = error instanceof ReportingError
  const code = known ? error.code : "server_error"
  const safeCode = /^[a-z_]+$/.test(code)
    ? code
    : code === "RATE_LIMITED"
      ? "temporarily_unavailable"
      : "invalid_request"
  return Response.json(
    {
      error: safeCode,
      error_description: known
        ? code
        : "The authorization service is temporarily unavailable.",
    },
    {
      status: known ? error.status : 503,
      headers: {
        ...oauthCorsHeaders,
        ...(known && error.retryAfter
          ? { "Retry-After": String(error.retryAfter) }
          : {}),
      },
    },
  )
}
export function oauthOptions() {
  return new Response(null, { status: 204, headers: oauthCorsHeaders })
}
export async function oauthForm<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  if (
    !request.headers
      .get("content-type")
      ?.startsWith("application/x-www-form-urlencoded")
  )
    throw new ReportingError("invalid_request", 415)
  const parsed = schema.safeParse(
    uniqueParams(new URLSearchParams(await boundedText(request))),
  )
  if (!parsed.success) throw new ReportingError("invalid_request")
  return parsed.data
}
