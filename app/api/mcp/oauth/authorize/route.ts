import { NextResponse } from "next/server"
import { reportingOrigin } from "@/lib/google-reporting/config"
import { reportingRateLimit } from "@/lib/google-reporting/rate-limit"
import { beginMcpAuthorization } from "@/lib/mcp/oauth"
import { oauthError } from "@/lib/mcp/http"
export async function GET(request: Request) {
  try {
    await reportingRateLimit("mcp-authorize-global", 300)
    const id = await beginMcpAuthorization(new URL(request.url).searchParams)
    return NextResponse.redirect(
      new URL(`/mcp/authorize?request=${id}`, reportingOrigin()),
      {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    )
  } catch (error) {
    return oauthError(error)
  }
}
