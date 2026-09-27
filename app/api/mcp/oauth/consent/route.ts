import { z } from "zod"
import {
  reportingSession,
  jsonBody,
  noStoreJson,
} from "@/lib/google-reporting/http"
import { reportingErrorResponse } from "@/lib/google-reporting/errors"
import { reportingRateLimit } from "@/lib/google-reporting/rate-limit"
import { decideMcpAuthorization } from "@/lib/mcp/oauth"
export async function POST(request: Request) {
  try {
    const session = await reportingSession(request, true)
    await reportingRateLimit(`mcp-consent:${session.user.id}`, 20)
    const input = await jsonBody(
      request,
      z
        .object({
          requestId: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          accept: z.boolean(),
          businessId: z.string().min(1).max(255).optional(),
          resourceIds: z.array(z.string().uuid()).max(100).optional(),
        })
        .strict(),
    )
    return noStoreJson({
      url: await decideMcpAuthorization({ ...input, userId: session.user.id }),
    })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
