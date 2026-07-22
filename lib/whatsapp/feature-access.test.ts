import { describe, expect, test } from "bun:test"
import {
  hasWhatsAppEarlyAccess,
  WHATSAPP_REVIEWER_EMAIL,
} from "./feature-access"

describe("WhatsApp early-access rollout", () => {
  test("allows only the isolated reviewer in production", () => {
    expect(hasWhatsAppEarlyAccess(WHATSAPP_REVIEWER_EMAIL, "production")).toBe(true)
    expect(hasWhatsAppEarlyAccess(WHATSAPP_REVIEWER_EMAIL.toUpperCase(), "production")).toBe(true)
    expect(hasWhatsAppEarlyAccess("customer@example.com", "production")).toBe(false)
    expect(hasWhatsAppEarlyAccess(null, "production")).toBe(false)
  })

  test("keeps local development available", () => {
    expect(hasWhatsAppEarlyAccess("developer@example.com", "development")).toBe(true)
    expect(hasWhatsAppEarlyAccess(undefined, "test")).toBe(true)
  })
})
