import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { reportingMcpGrant } from "@/lib/db/schema"
import { reportingOrigin } from "@/lib/google-reporting/config"
import {
  ReportingError,
  reportingErrorResponse,
} from "@/lib/google-reporting/errors"
import { reportingRateLimit } from "@/lib/google-reporting/rate-limit"
import { authorizeMcpToken } from "@/lib/mcp/oauth"
import { createReportingMcpServer } from "@/lib/mcp/server"
import { MCP_SCOPE } from "@/lib/mcp/config"
export const runtime = "nodejs"
export const maxDuration = 120

function checkOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (origin && origin !== reportingOrigin())
    throw new ReportingError("INVALID_ORIGIN", 403)
}
function headers(response: Response, request: Request) {
  response.headers.set("Cache-Control", "no-store")
  response.headers.set(
    "Access-Control-Expose-Headers",
    "WWW-Authenticate, Retry-After",
  )
  response.headers.set("Vary", "Origin")
  if (request.headers.get("origin") === reportingOrigin())
    response.headers.set("Access-Control-Allow-Origin", reportingOrigin())
  return response
}
async function handle(request: Request) {
  let server: ReturnType<typeof createReportingMcpServer> | undefined
  try {
    checkOrigin(request)
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(
      request.headers.get("authorization") || "",
    )
    if (!match) throw new ReportingError("invalid_token", 401)
    const grant = await authorizeMcpToken(match[1])
    if (request.method !== "POST")
      return headers(
        new Response(null, {
          status: 405,
          headers: { Allow: "POST, OPTIONS" },
        }),
        request,
      )
    await reportingRateLimit(`mcp-request:${grant.userId}`, 120)
    server = createReportingMcpServer(match[1])
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: 32768,
    })
    await server.connect(transport)
    const response = await transport.handleRequest(request)
    if (response.ok)
      await db
        .update(reportingMcpGrant)
        .set({ lastUsedAt: new Date() })
        .where(eq(reportingMcpGrant.id, grant.id))
    return headers(response, request)
  } catch (error) {
    const response = reportingErrorResponse(error)
    if (error instanceof ReportingError && error.status === 401)
      response.headers.set(
        "WWW-Authenticate",
        `Bearer resource_metadata="${reportingOrigin()}/.well-known/oauth-protected-resource/api/mcp", scope="${MCP_SCOPE} offline_access", error="invalid_token"`,
      )
    return headers(response, request)
  } finally {
    await server?.close()
  }
}
export const POST = handle
export const GET = handle
export const DELETE = handle
export function OPTIONS(request: Request) {
  try {
    checkOrigin(request)
    return headers(
      new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization, Content-Type, Accept, MCP-Protocol-Version",
          "Access-Control-Max-Age": "600",
        },
      }),
      request,
    )
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
