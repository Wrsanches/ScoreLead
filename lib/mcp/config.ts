import { reportingOrigin } from "@/lib/google-reporting/config"
export const MCP_SCOPE = "analytics:read"
export const mcpResource = () => `${reportingOrigin()}/api/mcp`
export const mcpIssuer = () => reportingOrigin()
export const ACCESS_TOKEN_SECONDS = 3600
export const GRANT_SECONDS = 30 * 86400
export function resourceMetadata() {
  return {
    resource: mcpResource(),
    resource_name: "Scorelead Analytics",
    authorization_servers: [mcpIssuer()],
    scopes_supported: [MCP_SCOPE, "offline_access"],
    bearer_methods_supported: ["header"],
  }
}
export function authorizationMetadata() {
  const base = `${mcpIssuer()}/api/mcp/oauth`
  return {
    issuer: mcpIssuer(),
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/token`,
    registration_endpoint: `${base}/register`,
    revocation_endpoint: `${base}/revoke`,
    scopes_supported: [MCP_SCOPE, "offline_access"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    authorization_response_iss_parameter_supported: true,
    client_id_metadata_document_supported: false,
  }
}
export const oauthCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
}
