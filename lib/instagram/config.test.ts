import { afterEach, expect, test } from "bun:test"
import { instagramEnabled } from "./config"

const names = ["INSTAGRAM_INTEGRATION_ENABLED", "INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET", "INSTAGRAM_REDIRECT_URI", "INSTAGRAM_TOKEN_ENCRYPTION_KEY", "INSTAGRAM_ALLOWED_BUSINESS_IDS"] as const
const original = Object.fromEntries(names.map((name) => [name, process.env[name]]))
afterEach(() => {
  for (const name of names) {
    if (original[name] === undefined) delete process.env[name]
    else process.env[name] = original[name]
  }
})

test("rollout list restricts customer activation while preserving worker reconciliation", () => {
  process.env.INSTAGRAM_INTEGRATION_ENABLED = "true"
  process.env.INSTAGRAM_APP_ID = "test-app"
  process.env.INSTAGRAM_APP_SECRET = "test-secret"
  process.env.INSTAGRAM_REDIRECT_URI = "https://app.example.com/api/instagram/callback"
  process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = "test-key"
  process.env.INSTAGRAM_ALLOWED_BUSINESS_IDS = " review-business, another-test "
  expect(instagramEnabled("review-business")).toBe(true)
  expect(instagramEnabled("other-customer")).toBe(false)
  expect(instagramEnabled()).toBe(true)
  process.env.INSTAGRAM_ALLOWED_BUSINESS_IDS = ""
  expect(instagramEnabled("other-customer")).toBe(true)
  process.env.INSTAGRAM_INTEGRATION_ENABLED = "false"
  expect(instagramEnabled("review-business")).toBe(false)
})
