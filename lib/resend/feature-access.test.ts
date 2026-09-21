import { describe, expect, test } from "bun:test"
import { isResendIntegrationEnabled } from "./feature-access"

describe("Resend production rollout", () => {
  test("production requires the flag", () => {
    expect(isResendIntegrationEnabled("production", "true")).toBe(true)
    expect(isResendIntegrationEnabled("production", "false")).toBe(false)
    expect(isResendIntegrationEnabled("production", undefined)).toBe(false)
  })
  test("development and test are always on", () => {
    expect(isResendIntegrationEnabled("development", "false")).toBe(true)
    expect(isResendIntegrationEnabled("test", undefined)).toBe(true)
  })
})
