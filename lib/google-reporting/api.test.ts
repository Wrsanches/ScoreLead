import { afterEach, expect, mock, test } from "bun:test"
import {
  exchangeGoogleCode,
  googleAuthorizationUrl,
  googleJson,
  googleIdentity,
  listGoogleResources,
  refreshGoogleToken,
} from "./api"
import { GOOGLE_REPORTING_SCOPES } from "./config"
const original = globalThis.fetch
const env = process.env.BETTER_AUTH_URL
afterEach(() => {
  globalThis.fetch = original
  if (env === undefined) delete process.env.BETTER_AUTH_URL
  else process.env.BETTER_AUTH_URL = env
})
function fetchWith(fn: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) =>
    fn(String(url), init),
  ) as unknown as typeof fetch
}
test("Google consent is readonly, incremental per provider, offline and PKCE protected", () => {
  process.env.BETTER_AUTH_URL = "https://app.example.com"
  const url = new URL(googleAuthorizationUrl("ga4", "state", "v".repeat(43)))
  expect(url.searchParams.get("scope")).toBe(
    `openid email ${GOOGLE_REPORTING_SCOPES.ga4}`,
  )
  expect(url.searchParams.get("access_type")).toBe("offline")
  expect(url.searchParams.get("code_challenge_method")).toBe("S256")
  expect(url.searchParams.get("redirect_uri")).toBe(
    "https://app.example.com/api/google-reporting/callback",
  )
})
test("denied scope fails before connection is stored", async () => {
  fetchWith(async () =>
    Response.json({
      access_token: "private",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "openid email",
    }),
  )
  await expect(exchangeGoogleCode("code", "verifier", "ga4")).rejects.toThrow(
    "GOOGLE_PERMISSIONS_REQUIRED",
  )
})
test("invalid refresh grant becomes reconnect, never raw provider content", async () => {
  fetchWith(async () =>
    Response.json(
      { error: "invalid_grant", error_description: "secret" },
      { status: 400 },
    ),
  )
  await expect(refreshGoogleToken("secret")).rejects.toThrow(
    "GOOGLE_RECONNECT_REQUIRED",
  )
})
test("token response must be complete and Bearer", async () => {
  fetchWith(async () =>
    Response.json({
      access_token: "private",
      token_type: "Other",
      expires_in: 0,
    }),
  )
  await expect(refreshGoogleToken("secret")).rejects.toThrow(
    "GOOGLE_INVALID_RESPONSE",
  )
})
test("Google account identity must have a verified email", async () => {
  fetchWith(async () =>
    Response.json({ sub: "1", email: "me@example.com", email_verified: false }),
  )
  await expect(googleIdentity("token")).rejects.toThrow(
    "GOOGLE_IDENTITY_REQUIRED",
  )
})
test("GA property discovery follows pages and deduplicates results", async () => {
  let count = 0
  fetchWith(async (url) => {
    count++
    if (count === 2)
      expect(new URL(url).searchParams.get("pageToken")).toBe("next")
    return Response.json({
      accountSummaries: [
        {
          displayName: "Account",
          propertySummaries: [
            { property: "properties/123", displayName: "Site" },
            ...(count === 2 ? [{ property: "properties/456" }] : []),
          ],
        },
      ],
      ...(count === 1 ? { nextPageToken: "next" } : {}),
    })
  })
  expect(await listGoogleResources("ga4", "token")).toEqual([
    { externalId: "properties/123", name: "Account / Site" },
    { externalId: "properties/456", name: "Account / properties/456" },
  ])
})
test("GA discovery detects repeated page tokens", async () => {
  fetchWith(async () => Response.json({ nextPageToken: "loop" }))
  await expect(listGoogleResources("ga4", "token")).rejects.toThrow(
    "GOOGLE_INVALID_RESPONSE",
  )
})
test("Search Console preserves domain properties and excludes unverified sites", async () => {
  fetchWith(async () =>
    Response.json({
      siteEntry: [
        { siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" },
        {
          siteUrl: "https://example.org/",
          permissionLevel: "siteRestrictedUser",
        },
        { siteUrl: "https://bad.test/", permissionLevel: "siteUnverifiedUser" },
      ],
    }),
  )
  expect(
    (await listGoogleResources("search_console", "token")).map(
      (r) => r.externalId,
    ),
  ).toEqual(["sc-domain:example.com", "https://example.org/"])
})
test("report egress refuses arbitrary URLs before fetching", async () => {
  fetchWith(async () => {
    throw new Error("must not fetch")
  })
  await expect(googleJson("https://evil.test", "secret")).rejects.toThrow(
    "INVALID_GOOGLE_ENDPOINT",
  )
})
test("Google quota responses return a bounded retry delay and never retry immediately", async () => {
  let calls = 0
  fetchWith(async () => {
    calls++
    return Response.json(
      { error: "private" },
      { status: 429, headers: { "Retry-After": "9000" } },
    )
  })
  try {
    await googleJson("https://analyticsdata.googleapis.com/report", "secret")
  } catch (e) {
    expect((e as { retryAfter: number }).retryAfter).toBe(3600)
  }
  expect(calls).toBe(1)
})
test("transient errors retry once; malformed success responses fail cleanly", async () => {
  let calls = 0
  fetchWith(async () =>
    ++calls === 1
      ? new Response("private", { status: 503 })
      : Response.json({ ok: true }),
  )
  expect(
    await googleJson<{ ok: boolean }>(
      "https://analyticsdata.googleapis.com/report",
      "secret",
    ),
  ).toEqual({ ok: true })
  expect(calls).toBe(2)
  fetchWith(async () => new Response("bad JSON"))
  await expect(
    googleJson("https://analyticsdata.googleapis.com/report", "secret"),
  ).rejects.toThrow("GOOGLE_INVALID_RESPONSE")
})
test("report calls never put credentials in URLs and disallow redirects", async () => {
  fetchWith(async (url, init) => {
    expect(url).not.toContain("secret")
    expect(init?.redirect).toBe("error")
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret",
    )
    return Response.json({})
  })
  await googleJson("https://analyticsdata.googleapis.com/report", "secret", {
    metrics: [],
  })
})
