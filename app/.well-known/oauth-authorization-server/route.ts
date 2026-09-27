import { authorizationMetadata } from "@/lib/mcp/config"
import { oauthJson, oauthOptions } from "@/lib/mcp/http"
export const GET = () => oauthJson(authorizationMetadata())
export const OPTIONS = oauthOptions
