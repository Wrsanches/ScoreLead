import { z } from "zod"
import type { GoogleReportingProvider } from "@/lib/db/schema"
import {
  googleReportingConfig,
  reportingScopes,
  GOOGLE_REPORTING_SCOPES,
} from "./config"
import { ReportingError } from "./errors"
import { pkceChallenge } from "./security"

const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().positive().max(86400),
  scope: z.string().optional(),
  token_type: z.string().refine((v) => v.toLowerCase() === "bearer"),
})
export type GoogleTokens = z.infer<typeof tokenSchema>
export type ReportingCandidate = { externalId: string; name: string }
export function googleAuthorizationUrl(
  provider: GoogleReportingProvider,
  state: string,
  verifier: string,
) {
  const config = googleReportingConfig()
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: reportingScopes(provider).join(" "),
    access_type: "offline",
    prompt: "consent select_account",
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
  }).toString()
  return url.toString()
}

async function tokenRequest(
  params: Record<string, string>,
): Promise<GoogleTokens> {
  const config = googleReportingConfig()
  let response: Response
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...params,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new ReportingError("GOOGLE_UNAVAILABLE", 502)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    if (data?.error === "invalid_grant")
      throw new ReportingError("GOOGLE_RECONNECT_REQUIRED", 401)
    if (data?.error === "invalid_client")
      throw new ReportingError("REPORTING_NOT_CONFIGURED", 503)
    throw new ReportingError("GOOGLE_UNAVAILABLE", 502)
  }
  const parsed = tokenSchema.safeParse(data)
  if (!parsed.success) throw new ReportingError("GOOGLE_INVALID_RESPONSE", 502)
  return parsed.data
}
export async function exchangeGoogleCode(
  code: string,
  verifier: string,
  provider: GoogleReportingProvider,
) {
  const tokens = await tokenRequest({
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: googleReportingConfig().redirectUri,
  })
  if (!tokens.scope?.split(" ").includes(GOOGLE_REPORTING_SCOPES[provider]))
    throw new ReportingError("GOOGLE_PERMISSIONS_REQUIRED", 403)
  return tokens
}
export const refreshGoogleToken = (refreshToken: string) =>
  tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" })

// URLs are constructed internally. Never accept a URL or provider body from an MCP caller.
export async function googleJson<T>(
  url: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const destination = new URL(url)
  if (
    destination.protocol !== "https:" ||
    ![
      "analyticsadmin.googleapis.com",
      "analyticsdata.googleapis.com",
      "www.googleapis.com",
      "openidconnect.googleapis.com",
    ].includes(destination.hostname)
  )
    throw new ReportingError("INVALID_GOOGLE_ENDPOINT")
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response
    try {
      response = await fetch(url, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      throw new ReportingError("GOOGLE_UNAVAILABLE", 502)
    }
    if (response.ok) {
      try {
        return (await response.json()) as T
      } catch {
        throw new ReportingError("GOOGLE_INVALID_RESPONSE", 502)
      }
    }
    const retryAfter = Math.min(
      3600,
      Math.max(1, Number(response.headers.get("retry-after")) || 60),
    )
    if (attempt === 0 && [502, 503, 504].includes(response.status)) continue
    if (response.status === 401)
      throw new ReportingError("GOOGLE_RECONNECT_REQUIRED", 401)
    if (response.status === 429)
      throw new ReportingError("GOOGLE_QUOTA_EXCEEDED", 429, retryAfter)
    if (response.status === 403) {
      const error = await response.json().catch(() => ({}))
      const quota =
        error?.error?.errors?.some((v: { reason?: string }) =>
          [
            "rateLimitExceeded",
            "userRateLimitExceeded",
            "quotaExceeded",
          ].includes(v.reason || ""),
        ) || error?.error?.status === "RESOURCE_EXHAUSTED"
      throw new ReportingError(
        quota ? "GOOGLE_QUOTA_EXCEEDED" : "GOOGLE_ACCESS_DENIED",
        quota ? 429 : 403,
        quota ? retryAfter : undefined,
      )
    }
    if (response.status === 400)
      throw new ReportingError("INVALID_REPORT_FIELDS", 400)
    if (response.status === 404)
      throw new ReportingError("GOOGLE_RESOURCE_NOT_FOUND", 404)
    throw new ReportingError("GOOGLE_UNAVAILABLE", 502)
  }
  throw new ReportingError("GOOGLE_UNAVAILABLE", 502)
}
export async function googleIdentity(token: string) {
  const result = await googleJson<unknown>(
    "https://openidconnect.googleapis.com/v1/userinfo",
    token,
  )
  const parsed = z
    .object({
      sub: z.string().min(1).max(255),
      email: z.email(),
      email_verified: z.literal(true),
    })
    .safeParse(result)
  if (!parsed.success) throw new ReportingError("GOOGLE_IDENTITY_REQUIRED", 403)
  return parsed.data
}
export async function listGoogleResources(
  provider: GoogleReportingProvider,
  token: string,
): Promise<ReportingCandidate[]> {
  if (provider === "search_console") {
    const data = await googleJson<{
      siteEntry?: { siteUrl: string; permissionLevel: string }[]
    }>("https://www.googleapis.com/webmasters/v3/sites", token)
    return (data.siteEntry || [])
      .filter((site) =>
        ["siteOwner", "siteFullUser", "siteRestrictedUser"].includes(
          site.permissionLevel,
        ),
      )
      .map((site) => ({ externalId: site.siteUrl, name: site.siteUrl }))
  }
  const resources: ReportingCandidate[] = []
  const seen = new Set<string>()
  let pageToken = ""
  for (let page = 0; page < 100; page++) {
    const params = new URLSearchParams({
      pageSize: "200",
      ...(pageToken ? { pageToken } : {}),
    })
    const data = await googleJson<{
      accountSummaries?: {
        displayName?: string
        propertySummaries?: { property: string; displayName?: string }[]
      }[]
      nextPageToken?: string
    }>(
      `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?${params}`,
      token,
    )
    for (const account of data.accountSummaries || []) {
      for (const property of account.propertySummaries || []) {
        if (/^properties\/\d+$/.test(property.property))
          resources.push({
            externalId: property.property,
            name: [
              account.displayName,
              property.displayName || property.property,
            ]
              .filter(Boolean)
              .join(" / "),
          })
      }
    }
    if (!data.nextPageToken)
      return Array.from(
        new Map(resources.map((v) => [v.externalId, v])).values(),
      )
    if (seen.has(data.nextPageToken))
      throw new ReportingError("GOOGLE_INVALID_RESPONSE", 502)
    seen.add(data.nextPageToken)
    pageToken = data.nextPageToken
  }
  throw new ReportingError("TOO_MANY_GOOGLE_PROPERTIES", 422)
}
