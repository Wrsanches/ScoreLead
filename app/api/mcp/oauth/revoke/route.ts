import { z } from "zod"
import { reportingRateLimit } from "@/lib/google-reporting/rate-limit"
import { revokeMcpToken } from "@/lib/mcp/oauth"
import { oauthError, oauthJson, oauthForm, oauthOptions } from "@/lib/mcp/http"
export const OPTIONS = oauthOptions
export async function POST(request: Request) {
  try {
    await reportingRateLimit("mcp-revoke-global", 300)
    const input = await oauthForm(
      request,
      z.object({
        client_id: z.string().uuid(),
        token: z.string().min(1).max(2048),
        token_type_hint: z.string().optional(),
      }),
    )
    await revokeMcpToken(input.token, input.client_id)
    return oauthJson({})
  } catch (error) {
    return oauthError(error)
  }
}
