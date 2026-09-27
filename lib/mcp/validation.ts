import { z } from "zod"
import { MCP_SCOPE, mcpResource } from "./config"
import { ReportingError } from "@/lib/google-reporting/errors"

export function validRedirectUri(value: string) {
  try {
    const url = new URL(value)
    return (
      value.length <= 2048 &&
      !url.hash &&
      !value.includes("#") &&
      !url.username &&
      !url.password &&
      !value.includes("*") &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname)))
    )
  } catch {
    return false
  }
}
export function redirectMatches(registered: string, requested: string) {
  // Exact matching, including loopback ports registered dynamically by the client.
  return validRedirectUri(requested) && registered === requested
}
export function parseScopes(scope: string) {
  const scopes = [...new Set(scope.split(/\s+/).filter(Boolean))]
  if (
    !scopes.includes(MCP_SCOPE) ||
    scopes.some((s) => ![MCP_SCOPE, "offline_access"].includes(s))
  )
    throw new ReportingError("invalid_scope")
  return scopes.sort().join(" ")
}
export const registrationSchema = z.object({
  client_name: z.string().trim().min(1).max(120).default("AI assistant"),
  redirect_uris: z.array(z.string().refine(validRedirectUri)).min(1).max(5),
  token_endpoint_auth_method: z.literal("none").default("none"),
  grant_types: z
    .array(z.enum(["authorization_code", "refresh_token"]))
    .min(1)
    .max(2)
    .default(["authorization_code", "refresh_token"])
    .refine((v) => v.includes("authorization_code")),
  response_types: z.array(z.literal("code")).length(1).default(["code"]),
  scope: z.string().max(200).optional(),
}) // Unused RFC 7591 metadata is ignored; we never fetch client-supplied URLs.
export function uniqueParams(params: URLSearchParams) {
  const result: Record<string, string> = {}
  for (const [key, value] of params) {
    if (Object.hasOwn(result, key)) throw new ReportingError("invalid_request")
    if (value.length > 4096) throw new ReportingError("invalid_request")
    result[key] = value
  }
  return result
}
export const authorizationSchema = z.object({
  client_id: z.string().uuid(),
  redirect_uri: z.string().refine(validRedirectUri),
  response_type: z.literal("code"),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal("S256"),
  state: z.string().max(2048).optional(),
  scope: z.string().max(200).optional(),
  resource: z.string().refine((value) => value === mcpResource()),
})
export const tokenSchema = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    client_id: z.string().uuid(),
    code: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    redirect_uri: z.string().refine(validRedirectUri),
    code_verifier: z.string().min(43).max(128),
    resource: z.string().optional(),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    client_id: z.string().uuid(),
    refresh_token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    resource: z.string().optional(),
    scope: z.string().optional(),
  }),
])
