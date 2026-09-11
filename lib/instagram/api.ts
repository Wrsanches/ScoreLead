import { instagramConfig, INSTAGRAM_SCOPES } from "./config"

export class InstagramApiError extends Error {
  constructor(
    public code: number,
    public transient: boolean,
    public httpStatus: number,
    public operation = "graph",
    public reason = "REQUEST_REJECTED",
    public detail = "",
  ) {
    // The user-facing message is fixed; diagnostics are scrubbed separately.
    super("INSTAGRAM_API_ERROR")
  }
}
function safeProviderDetail(message: string, url: URL | string, init: RequestInit) {
  const params = new URL(url).searchParams
  const secrets = [new Headers(init.headers).get("authorization")?.replace(/^Bearer\s+/i, "")]
  for (const key of ["access_token", "client_secret", "code"]) {
    secrets.push(params.get(key) || undefined)
    if (init.body instanceof FormData || init.body instanceof URLSearchParams) {
      const value = init.body.get(key)
      if (typeof value === "string") secrets.push(value)
    }
  }
  let safe = message
  for (const secret of secrets.filter((value): value is string => Boolean(value))) {
    safe = safe.split(secret).join("[redacted]").split(encodeURIComponent(secret)).join("[redacted]")
  }
  return safe.replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[A-Za-z0-9_=-]{24,}/g, "[redacted]")
    .replace(/[\r\n\t]/g, " ").slice(0, 240)
}
async function request<T>(
  url: URL | string,
  init: RequestInit = {},
  operation = "graph",
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.error || !body) {
    const message = String(body?.error?.message || body?.error_message || "")
    const reason = /client.?secret/i.test(message) ? "CLIENT_SECRET_REJECTED"
      : /redirect.*uri/i.test(message) ? "REDIRECT_URI_REJECTED"
      : /authorization code|code.*(used|expired|valid)/i.test(message) ? "AUTHORIZATION_CODE_REJECTED"
      : /tester|app role|developer role|not authorized/i.test(message) ? "ACCOUNT_NOT_AUTHORIZED"
      : /access.?token/i.test(message) ? "ACCESS_TOKEN_REJECTED"
      : /permission/i.test(message) ? "PERMISSIONS_REJECTED"
      : /client.?id|app.?id|application/i.test(message) ? "APP_REJECTED"
      : "REQUEST_REJECTED"
    throw new InstagramApiError(
      Number(body?.error?.code || body?.code || 0),
      Boolean(
        body?.error?.is_transient ||
        response.status === 429 ||
        response.status >= 500,
      ),
      response.status,
      operation,
      reason,
      safeProviderDetail(message, url, init),
    )
  }
  return body as T
}
export function authorizationUrl(state: string) {
  const { appId, redirectUri } = instagramConfig()
  const url = new URL("https://www.instagram.com/oauth/authorize")
  url.search = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state,
    enable_fb_login: "0",
    force_authentication: "1",
  }).toString()
  return url.toString()
}
type AccessToken = { access_token: string; expires_in: number }
export async function exchangeInstagramCode(code: string) {
  const { appId, appSecret, redirectUri } = instagramConfig()
  const body = new FormData()
  Object.entries({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  }).forEach(([k, v]) => body.set(k, v))
  type Short = {
    access_token: string
    user_id: string
    permissions?: string | string[]
  }
  const result = await request<Short & { data?: Short[] }>(
    "https://api.instagram.com/oauth/access_token",
    { method: "POST", body },
    "authorization_code",
  )
  const short = result.data?.[0] ?? result
  if (!short.access_token || !short.user_id)
    throw new Error("INSTAGRAM_AUTH_FAILED")
  const permissions = Array.isArray(short.permissions)
    ? short.permissions
    : (short.permissions || "").split(",")
  if (!INSTAGRAM_SCOPES.every((scope) => permissions.includes(scope)))
    throw new Error("INSTAGRAM_PERMISSIONS_REQUIRED")
  const url = new URL("https://graph.instagram.com/access_token")
  url.search = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: short.access_token,
  }).toString()
  const token = await request<AccessToken>(url, {}, "long_lived_token")
  validateToken(token)
  return { ...token, oauthUserId: String(short.user_id) }
}
function validateToken(token: AccessToken) {
  if (
    !token.access_token ||
    !Number.isFinite(token.expires_in) ||
    token.expires_in <= 0
  )
    throw new Error("INSTAGRAM_AUTH_FAILED")
}
export async function refreshInstagramToken(accessToken: string) {
  const url = new URL("https://graph.instagram.com/refresh_access_token")
  url.search = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: accessToken,
  }).toString()
  const token = await request<AccessToken>(url)
  validateToken(token)
  return token
}
async function graph<T>(
  path: string,
  token: string,
  body?: Record<string, string>,
) {
  const { version } = instagramConfig()
  return request<T>(`https://graph.instagram.com/${version}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}` },
    ...(body ? { body: new URLSearchParams(body) } : {}),
  })
}
export async function instagramProfile(token: string) {
  type Profile = { user_id: string; username: string }
  const result = await graph<Profile & { data?: Profile[] }>(
    "me?fields=user_id,username",
    token,
  )
  const profile = result.data?.[0] ?? result
  if (!/^\d+$/.test(String(profile.user_id)) || !profile.username)
    throw new Error("INSTAGRAM_AUTH_FAILED")
  return {
    instagramUserId: String(profile.user_id),
    username: profile.username,
  }
}
export async function createImageContainer(
  account: string,
  token: string,
  imageUrl: string,
  caption?: string,
) {
  const result = await graph<{ id: string }>(`${account}/media`, token, {
    image_url: imageUrl,
    ...(caption === undefined ? { is_carousel_item: "true" } : { caption }),
  })
  if (!result.id) throw new Error("INSTAGRAM_API_RESPONSE_INVALID")
  return result.id
}
export async function createCarouselContainer(
  account: string,
  token: string,
  children: string[],
  caption: string,
) {
  const result = await graph<{ id: string }>(`${account}/media`, token, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  })
  if (!result.id) throw new Error("INSTAGRAM_API_RESPONSE_INVALID")
  return result.id
}
export async function containerStatus(container: string, token: string) {
  const result = await graph<{
    status_code: "IN_PROGRESS" | "FINISHED" | "PUBLISHED" | "ERROR" | "EXPIRED"
  }>(`${container}?fields=status_code`, token)
  if (!result.status_code) throw new Error("INSTAGRAM_API_RESPONSE_INVALID")
  return result.status_code
}
export async function publishContainer(
  account: string,
  token: string,
  container: string,
) {
  const result = await graph<{ id: string }>(
    `${account}/media_publish`,
    token,
    { creation_id: container },
  )
  if (!result.id) throw new Error("INSTAGRAM_API_RESPONSE_INVALID")
  return result.id
}
export async function mediaPermalink(media: string, token: string) {
  const result = await graph<{ permalink?: string }>(
    `${media}?fields=permalink`,
    token,
  )
  if (!result.permalink) return null
  const url = new URL(result.permalink)
  return url.protocol === "https:" &&
    (url.hostname === "www.instagram.com" || url.hostname === "instagram.com")
    ? url.toString()
    : null
}
