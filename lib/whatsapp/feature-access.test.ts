import { describe, expect, test } from "bun:test"
import { hasWhatsAppEarlyAccess } from "./feature-access"

describe("WhatsApp production rollout", () => {
  test("allows customers only when the production flag is enabled", () => {
    expect(hasWhatsAppEarlyAccess("customer@example.com", "production", "true")).toBe(true)
    expect(hasWhatsAppEarlyAccess(null, "production", "true")).toBe(true)
    expect(hasWhatsAppEarlyAccess("customer@example.com", "production", "false")).toBe(false)
    expect(hasWhatsAppEarlyAccess(null, "production", undefined)).toBe(false)
  })

  test("keeps local development available regardless of the production flag", () => {
    expect(hasWhatsAppEarlyAccess("developer@example.com", "development", "false")).toBe(true)
    expect(hasWhatsAppEarlyAccess(undefined, "test", undefined)).toBe(true)
  })
})
