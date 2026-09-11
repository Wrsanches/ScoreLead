export const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const

export function instagramConfig() {
  // These are the Instagram credentials displayed inside the SAME Meta app,
  // not the parent META_APP_ID / META_APP_SECRET used by WhatsApp.
  const appId = process.env.INSTAGRAM_APP_ID
  const appSecret = process.env.INSTAGRAM_APP_SECRET
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI
  if (!appId || !appSecret || !redirectUri)
    throw new Error("INSTAGRAM_NOT_CONFIGURED")
  const redirect = new URL(redirectUri)
  if (redirect.protocol !== "https:" && redirect.hostname !== "localhost")
    throw new Error("INSTAGRAM_NOT_CONFIGURED")
  const version = process.env.INSTAGRAM_GRAPH_API_VERSION || "v25.0"
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("INSTAGRAM_NOT_CONFIGURED")
  return { appId, appSecret, redirectUri, version }
}

export function instagramEnabled(businessId?: string) {
  if (process.env.INSTAGRAM_INTEGRATION_ENABLED !== "true") return false
  // An optional rollout list keeps App Review testing within named workspaces.
  // Workers omit the ID so they can finish/reconcile already-authorized jobs.
  const allowed = (process.env.INSTAGRAM_ALLOWED_BUSINESS_IDS || "")
    .split(",").map((id) => id.trim()).filter(Boolean)
  if (businessId && allowed.length && !allowed.includes(businessId)) return false
  try {
    instagramConfig()
    return Boolean(process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY)
  } catch {
    return false
  }
}
