const DEFAULT_PUBLIC_ORIGIN = "https://scorelead.io"
const DEFAULT_APP_ORIGIN = "https://app.scorelead.io"

type AuthOriginEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | "BETTER_AUTH_URL"
    | "SCORELEAD_PUBLIC_URL"
    | "NEXT_PUBLIC_SCORELEAD_PUBLIC_URL"
    | "SCORELEAD_APP_URL"
    | "NEXT_PUBLIC_SCORELEAD_APP_URL"
  >
>

function normalizeHttpOrigin(value: string | undefined) {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : null
  } catch {
    return null
  }
}

export function createTrustedAuthOrigins(
  env: AuthOriginEnv = process.env as AuthOriginEnv,
) {
  const candidates = [
    env.BETTER_AUTH_URL,
    env.SCORELEAD_PUBLIC_URL ??
      env.NEXT_PUBLIC_SCORELEAD_PUBLIC_URL ??
      DEFAULT_PUBLIC_ORIGIN,
    env.SCORELEAD_APP_URL ??
      env.NEXT_PUBLIC_SCORELEAD_APP_URL ??
      DEFAULT_APP_ORIGIN,
  ]

  return Array.from(
    new Set(
      candidates
        .map(normalizeHttpOrigin)
        .filter((origin): origin is string => Boolean(origin)),
    ),
  )
}

export const trustedAuthOrigins = createTrustedAuthOrigins()

export function getTrustedRequestOrigin(
  requestOrigin: string | null,
  trustedOrigins: readonly string[] = trustedAuthOrigins,
) {
  const normalizedOrigin = normalizeHttpOrigin(requestOrigin ?? undefined)
  return normalizedOrigin && trustedOrigins.includes(normalizedOrigin)
    ? normalizedOrigin
    : null
}
