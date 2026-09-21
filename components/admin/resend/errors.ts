/**
 * API errors carry a stable `code`; the UI prefers the translated message for
 * that code and falls back to the server's English text.
 */
export function resendErrorMessage(
  t: { has: (key: string) => boolean; (key: string): string },
  body: { error?: string; code?: string } | null | undefined,
  fallbackKey: string,
): string {
  const code = body?.code
  if (code && t.has(`errors.${code}`)) return t(`errors.${code}`)
  if (body?.error) return body.error
  return t(fallbackKey)
}

export async function readJson<T = Record<string, unknown>>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}
