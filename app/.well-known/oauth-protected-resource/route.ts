import { resourceMetadata } from "@/lib/mcp/config"
import { oauthJson, oauthOptions } from "@/lib/mcp/http"
export const GET = () => oauthJson(resourceMetadata())
export const OPTIONS = oauthOptions
