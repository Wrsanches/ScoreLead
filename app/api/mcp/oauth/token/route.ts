import { reportingRateLimit } from "@/lib/google-reporting/rate-limit"
import { tokenSchema } from "@/lib/mcp/validation"
import { exchangeMcpToken } from "@/lib/mcp/oauth"
import { oauthError, oauthJson, oauthForm, oauthOptions } from "@/lib/mcp/http"
export const OPTIONS = oauthOptions
export async function POST(request: Request) {
  try {
    await reportingRateLimit("mcp-token-global", 1000)
    const input = await oauthForm(request, tokenSchema)
    await reportingRateLimit(`mcp-token:${input.client_id}`, 60)
    return oauthJson(await exchangeMcpToken(input))
  } catch (error) {
    return oauthError(error)
  }
}
