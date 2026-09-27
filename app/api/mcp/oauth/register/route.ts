import { jsonBody } from "@/lib/google-reporting/http"
import { reportingRateLimit } from "@/lib/google-reporting/rate-limit"
import { registrationSchema } from "@/lib/mcp/validation"
import { registerMcpClient } from "@/lib/mcp/oauth"
import { oauthError, oauthJson, oauthOptions } from "@/lib/mcp/http"
export const OPTIONS = oauthOptions
export async function POST(request: Request) {
  try {
    await reportingRateLimit("mcp-register-global", 60)
    return oauthJson(
      await registerMcpClient(await jsonBody(request, registrationSchema)),
      201,
    )
  } catch (error) {
    return oauthError(error)
  }
}
