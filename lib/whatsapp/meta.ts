import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParameter,
} from "@/lib/db/schema"
import { metaAppSecretProof } from "@/lib/whatsapp/security"

const GRAPH_ORIGIN = "https://graph.facebook.com"

function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION || "v23.0"
}

function appCredentials() {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be configured")
  }
  return { appId, appSecret }
}

export class MetaGraphError extends Error {
  status: number
  code: string | null
  details: unknown

  constructor(message: string, status: number, code: string | null, details: unknown) {
    super(message)
    this.name = "MetaGraphError"
    this.status = status
    this.code = code
    this.details = details
  }
}

async function graphRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("https://")
    ? new URL(path)
    : new URL(`${GRAPH_ORIGIN}/${graphVersion()}/${path.replace(/^\//, "")}`)
  if (url.origin !== GRAPH_ORIGIN) throw new Error("Refusing an unexpected Meta Graph API origin")
  url.searchParams.delete("access_token")
  url.searchParams.set("appsecret_proof", metaAppSecretProof(accessToken))
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(15_000),
  })
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string; code?: number | string; error_subcode?: number | string } }
    | null
  if (!response.ok) {
    const error = body?.error
    throw new MetaGraphError(
      error?.message || `Meta Graph API request failed (${response.status})`,
      response.status,
      error?.error_subcode != null
        ? String(error.error_subcode)
        : error?.code != null
          ? String(error.code)
          : null,
      body,
    )
  }
  return body as T
}

export async function exchangeEmbeddedSignupCode(code: string): Promise<string> {
  const { appId, appSecret } = appCredentials()
  const url = new URL(`${GRAPH_ORIGIN}/${graphVersion()}/oauth/access_token`)
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("code", code)
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  const body = (await response.json().catch(() => null)) as
    | { access_token?: string; error?: { message?: string; code?: number | string } }
    | null
  if (!response.ok || !body?.access_token) {
    throw new MetaGraphError(
      body?.error?.message || "Could not exchange the Meta authorization code",
      response.status,
      body?.error?.code != null ? String(body.error.code) : null,
      body,
    )
  }
  return body.access_token
}

export async function subscribeWaba(wabaId: string, accessToken: string): Promise<void> {
  await graphRequest(`${wabaId}/subscribed_apps`, accessToken, { method: "POST" })
}

export async function unsubscribeWaba(wabaId: string, accessToken: string): Promise<void> {
  await graphRequest(`${wabaId}/subscribed_apps`, accessToken, { method: "DELETE" })
}

type MetaPhoneNumber = {
  id: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
}

export async function getWabaPhoneNumbers(
  wabaId: string,
  accessToken: string,
): Promise<MetaPhoneNumber[]> {
  const result = await graphRequest<{ data?: MetaPhoneNumber[] }>(
    `${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating&limit=100`,
    accessToken,
  )
  return result.data ?? []
}

export async function getWabaPhoneNumber(
  wabaId: string,
  phoneNumberId: string | undefined,
  accessToken: string,
): Promise<MetaPhoneNumber> {
  const phones = await getWabaPhoneNumbers(wabaId, accessToken)
  const phone = phoneNumberId ? phones.find((item) => item.id === phoneNumberId) : phones[0]
  if (!phone) {
    throw new MetaGraphError("No usable phone number was returned for this WABA", 400, null, phones)
  }
  if (!phoneNumberId && phones.length > 1) {
    throw new MetaGraphError("Meta returned multiple phone numbers without a selection; rerun Embedded Signup", 400, null, phones)
  }
  return phone
}

export type MetaMessageTemplate = {
  id: string
  name: string
  language: string
  category: string
  status: string
  components: WhatsAppTemplateComponent[]
  rejected_reason?: string
}

export async function listMessageTemplates(
  wabaId: string,
  accessToken: string,
): Promise<MetaMessageTemplate[]> {
  const templates: MetaMessageTemplate[] = []
  let page: string | null = `${wabaId}/message_templates?fields=id,name,language,category,status,components,rejected_reason&limit=100`
  for (let pageCount = 0; page && pageCount < 20; pageCount += 1) {
    const result: {
      data?: MetaMessageTemplate[]
      paging?: { next?: string }
    } = await graphRequest(page, accessToken)
    templates.push(...(result.data ?? []))
    page = result.paging?.next ?? null
  }
  return templates
}

/** Submit a brand-new message template for Meta review. Returns its id + status (usually PENDING). */
export async function createMessageTemplate(
  wabaId: string,
  accessToken: string,
  payload: {
    name: string
    language: string
    category: string
    components: WhatsAppTemplateComponent[]
  },
): Promise<{ id: string; status?: string; category?: string }> {
  return graphRequest(`${wabaId}/message_templates`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Edit an existing template's category and/or components. Meta only allows this
 * for APPROVED/REJECTED/PAUSED templates (not while PENDING), and name/language
 * cannot change. An accepted edit sends the template back to review.
 */
export async function editMessageTemplate(
  metaTemplateId: string,
  accessToken: string,
  payload: { category?: string; components: WhatsAppTemplateComponent[] },
): Promise<{ success?: boolean }> {
  return graphRequest(metaTemplateId, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/** Delete a specific template (by id + name deletes just that language variant). */
export async function deleteMessageTemplate(
  wabaId: string,
  accessToken: string,
  name: string,
  metaTemplateId?: string,
): Promise<void> {
  const params = new URLSearchParams({ name })
  if (metaTemplateId) params.set("hsm_id", metaTemplateId)
  await graphRequest(`${wabaId}/message_templates?${params.toString()}`, accessToken, {
    method: "DELETE",
  })
}

export async function sendTemplateMessage(input: {
  phoneNumberId: string
  accessToken: string
  toE164: string
  templateName: string
  language: string
  parameters: WhatsAppTemplateParameter[]
}): Promise<{ messageId: string }> {
  const bodyParameters = input.parameters.map((parameter) => ({
    type: "text",
    text: parameter.text,
    ...(parameter.parameterName ? { parameter_name: parameter.parameterName } : {}),
  }))
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: input.toE164.replace(/^\+/, ""),
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.language },
      ...(bodyParameters.length > 0
        ? { components: [{ type: "body", parameters: bodyParameters }] }
        : {}),
    },
  }
  const result = await graphRequest<{
    messages?: Array<{ id?: string; message_status?: string }>
  }>(`${input.phoneNumberId}/messages`, input.accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const messageId = result.messages?.[0]?.id
  if (!messageId) {
    throw new MetaGraphError("Meta accepted no message identifier", 502, null, result)
  }
  return { messageId }
}
