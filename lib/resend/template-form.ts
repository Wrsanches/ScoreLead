import { z } from "zod"
import {
  EMAIL_HTML_MAX_BYTES,
  EMAIL_SUBJECT_MAX,
  findUnknownVariables,
} from "@/lib/resend/render"
import {
  EMAIL_DOC_MAX_BYTES,
  collectDocumentStrings,
  documentBytes,
  emailDocumentSchema,
  findIncompleteBlocks,
} from "@/lib/resend/blocks"

/**
 * Shared validation for email templates and the Resend connection form. Used
 * by the API routes and mirrored in the client so both reject the same input.
 */

export const EMAIL_BODY_MODES = ["blocks", "html"] as const
export type EmailBodyMode = (typeof EMAIL_BODY_MODES)[number]

export const emailTemplateFormSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    subject: z.string().trim().min(1).max(EMAIL_SUBJECT_MAX),
    bodyMode: z.enum(EMAIL_BODY_MODES),
    /** Authoritative in blocks mode. */
    bodyDoc: emailDocumentSchema.nullable().optional(),
    /** Required in html mode; in blocks mode the server computes a snapshot. */
    bodyHtml: z.string().max(EMAIL_HTML_MAX_BYTES).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.bodyMode === "blocks") {
      const doc = value.bodyDoc
      if (!doc) {
        ctx.addIssue({ code: "custom", path: ["bodyDoc"], message: "BLOCKS_BODY_REQUIRED" })
        return
      }
      if (doc.blocks.length === 0) ctx.addIssue({ code: "custom", path: ["bodyDoc"], message: "BLOCKS_EMPTY" })
      if (documentBytes(doc) > EMAIL_DOC_MAX_BYTES) ctx.addIssue({ code: "custom", path: ["bodyDoc"], message: "DOC_TOO_LARGE" })
      const incomplete = findIncompleteBlocks(doc)
      if (incomplete.length > 0) {
        ctx.addIssue({ code: "custom", path: ["bodyDoc"], message: `BLOCK_INCOMPLETE:${incomplete.join(",")}` })
      }
      const unknown = findUnknownVariables(value.subject, ...collectDocumentStrings(doc))
      if (unknown.length > 0) {
        ctx.addIssue({ code: "custom", path: ["bodyDoc"], message: `UNKNOWN_VARIABLE:${unknown.join(",")}` })
      }
      return
    }
    if (!value.bodyHtml?.trim()) {
      ctx.addIssue({ code: "custom", path: ["bodyHtml"], message: "HTML_BODY_REQUIRED" })
      return
    }
    const unknown = findUnknownVariables(value.subject, value.bodyHtml)
    if (unknown.length > 0) {
      ctx.addIssue({ code: "custom", path: ["bodyHtml"], message: `UNKNOWN_VARIABLE:${unknown.join(",")}` })
    }
  })

export type EmailTemplateFormInput = z.infer<typeof emailTemplateFormSchema>

export const RESEND_API_KEY_RE = /^re_[A-Za-z0-9_-]{10,}$/

const email = z.string().trim().toLowerCase().email().max(254)

export const resendConnectionSchema = z.object({
  apiKey: z.string().trim().regex(RESEND_API_KEY_RE, "INVALID_API_KEY"),
  fromName: z.string().trim().min(1).max(120),
  fromEmail: email,
  replyTo: email.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  domainId: z.string().trim().min(1).max(120).optional(),
})

export type ResendConnectionInput = z.infer<typeof resendConnectionSchema>

export const resendSenderSettingsSchema = z
  .object({
    fromName: z.string().trim().min(1).max(120).optional(),
    fromEmail: email.optional(),
    replyTo: email.nullable().optional().or(z.literal("")).transform((v) => (v ? v : v === "" ? null : v)),
    webhookSigningSecret: z.string().trim().regex(/^whsec_[A-Za-z0-9+/=_-]{10,}$/).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "EMPTY_UPDATE" })

export type ResendSenderSettingsInput = z.infer<typeof resendSenderSettingsSchema>

/** Domain of an address, lowercased, or null when it is not an address. */
export function emailDomain(address: string): string | null {
  const at = address.lastIndexOf("@")
  if (at === -1) return null
  return address.slice(at + 1).toLowerCase() || null
}

/** Resend's shared onboarding domain, usable without verifying anything. */
export const RESEND_TEST_DOMAIN = "resend.dev"
