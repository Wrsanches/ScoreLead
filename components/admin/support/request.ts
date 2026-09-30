export class SupportRequestError extends Error {
  constructor(public code: string, public status: number) { super(code) }
}

export async function supportRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init, cache: "no-store", headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(65_000),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new SupportRequestError(body.code ?? (response.status === 401 ? "SESSION_EXPIRED" : response.status === 402 ? "PLAN_LIMIT" : response.status === 409 ? "WHATSAPP_NOT_CONNECTED" : "REQUEST_FAILED"), response.status)
  return body as T
}

export function supportErrorCode(error: unknown): string {
  return error instanceof SupportRequestError ? error.code : "REQUEST_FAILED"
}
