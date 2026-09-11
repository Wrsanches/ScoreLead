import { afterEach, beforeEach, expect, mock, test } from "bun:test"
import {
  authorizationUrl,
  exchangeInstagramCode,
  createImageContainer,
  createCarouselContainer,
  publishContainer,
  InstagramApiError,
} from "./api"
const originalFetch = globalThis.fetch
const envKeys = [
  "INSTAGRAM_APP_ID",
  "INSTAGRAM_APP_SECRET",
  "INSTAGRAM_REDIRECT_URI",
  "INSTAGRAM_GRAPH_API_VERSION",
] as const
const originalEnv = Object.fromEntries(
  envKeys.map((key) => [key, process.env[key]]),
)
beforeEach(() => {
  process.env.INSTAGRAM_APP_ID = "instagram-child-app"
  process.env.INSTAGRAM_APP_SECRET = "test-instagram-secret"
  process.env.INSTAGRAM_REDIRECT_URI =
    "https://app.scorelead.io/api/instagram/callback"
  process.env.INSTAGRAM_GRAPH_API_VERSION = "v25.0"
})
afterEach(() => {
  globalThis.fetch = originalFetch
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
})
test("authorization uses the Instagram credentials and only the requested scopes", () => {
  const url = new URL(authorizationUrl("opaque-state"))
  expect(url.origin).toBe("https://www.instagram.com")
  expect(url.searchParams.get("client_id")).toBe("instagram-child-app")
  expect(url.searchParams.get("scope")).toBe(
    "instagram_business_basic,instagram_business_content_publish",
  )
  expect(url.searchParams.get("state")).toBe("opaque-state")
})
test("exchanges a code through the documented form and long-lived token endpoint", async () => {
  const calls: { url: string; init?: RequestInit }[] = []
  globalThis.fetch = mock(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return Response.json(
        calls.length === 1
          ? {
              data: [
                {
                  access_token: "short",
                  user_id: "123",
                  permissions:
                    "instagram_business_basic,instagram_business_content_publish",
                },
              ],
            }
          : { access_token: "long", expires_in: 5184000 },
      )
    },
  ) as unknown as typeof fetch
  const result = await exchangeInstagramCode("authorization-code")
  expect(result.access_token).toBe("long")
  expect(result.oauthUserId).toBe("123")
  expect(calls[0].url).toBe("https://api.instagram.com/oauth/access_token")
  expect((calls[0].init?.body as FormData).get("client_secret")).toBe(
    "test-instagram-secret",
  )
  expect(new URL(calls[1].url).searchParams.get("grant_type")).toBe(
    "ig_exchange_token",
  )
})
test("denied publishing permission prevents a usable connection", async () => {
  globalThis.fetch = mock(async () =>
    Response.json({
      access_token: "short",
      user_id: "123",
      permissions: "instagram_business_basic",
    }),
  ) as unknown as typeof fetch
  await expect(exchangeInstagramCode("code")).rejects.toThrow(
    "INSTAGRAM_PERMISSIONS_REQUIRED",
  )
})
test("image, carousel and publish calls use bearer tokens and preserve caption Unicode", async () => {
  const calls: { url: string; init?: RequestInit }[] = []
  globalThis.fetch = mock(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return Response.json({ id: "123" })
    },
  ) as unknown as typeof fetch
  await createImageContainer(
    "account",
    "private-token",
    "https://images.example/a.jpg",
    "Olá 🌻",
  )
  await createCarouselContainer(
    "account",
    "private-token",
    ["1", "2"],
    "Olá 🌻",
  )
  await publishContainer("account", "private-token", "123")
  expect(calls[0].url).not.toContain("private-token")
  expect(new Headers(calls[0].init?.headers).get("authorization")).toBe(
    "Bearer private-token",
  )
  expect((calls[0].init?.body as URLSearchParams).get("caption")).toBe("Olá 🌻")
  expect((calls[1].init?.body as URLSearchParams).get("children")).toBe("1,2")
  expect(calls[2].url).toBe(
    "https://graph.instagram.com/v25.0/account/media_publish",
  )
})
test("API errors do not leak remote messages or secrets and do not blindly retry", async () => {
  const fetchMock = mock(async () =>
    Response.json(
      { error: { code: 190, message: "private-token from upstream" } },
      { status: 400 },
    ),
  )
  globalThis.fetch = fetchMock as unknown as typeof fetch
  try {
    await publishContainer("account", "private-token", "123")
    throw new Error("Expected rejection")
  } catch (error) {
    expect(error).toBeInstanceOf(InstagramApiError)
    expect((error as Error).message).not.toContain("private-token")
  }
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
