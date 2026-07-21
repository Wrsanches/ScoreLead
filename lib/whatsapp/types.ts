import type { WhatsAppTemplateComponent, WhatsAppTemplateParameter } from "@/lib/db/schema"

export const WHATSAPP_CONNECTION_STATUSES = ["connected", "needs_action", "disconnected"] as const
export type WhatsAppConnectionStatus = (typeof WHATSAPP_CONNECTION_STATUSES)[number]

export const WHATSAPP_SEQUENCE_STATUSES = [
  "draft",
  "scheduled",
  "paused",
  "completed",
  "cancelled",
  "failed",
] as const
export type WhatsAppSequenceStatus = (typeof WHATSAPP_SEQUENCE_STATUSES)[number]

export const WHATSAPP_STEP_STATUSES = [
  "queued",
  "sending",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
  "blocked",
  "needs_review",
  "cancelled",
] as const
export type WhatsAppStepStatus = (typeof WHATSAPP_STEP_STATUSES)[number]

export const WHATSAPP_CONSENT_SOURCES = [
  "website_form",
  "written",
  "verbal",
  "qr_code",
  "other",
] as const
export type WhatsAppConsentSource = (typeof WHATSAPP_CONSENT_SOURCES)[number]

export interface WhatsAppSequenceStepDraft {
  templateId: string
  offsetDays: number
  localSendTime: string
}

export interface WhatsAppSequencePreviewStep {
  position: number
  offsetDays: number
  localSendTime: string
  templateId: string
  templateName: string
  templateLanguage: string
  templateComponents: WhatsAppTemplateComponent[]
  templateParameters: WhatsAppTemplateParameter[]
  renderedBody: string
}

export type WhatsAppWebhookPayload = {
  object?: string
  entry?: Array<{
    id?: string
    time?: number
    changes?: Array<{
      field?: string
      value?: Record<string, unknown>
    }>
  }>
}
