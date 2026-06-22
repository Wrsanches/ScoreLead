import { test, expect, describe } from "bun:test"
import { isValidBusinessEmail } from "./lead-utils"

describe("isValidBusinessEmail", () => {
  test("accepts plain business emails", () => {
    expect(isValidBusinessEmail("hello@brightsmile.com")).toBe(true)
    expect(isValidBusinessEmail("Jane.Doe@sub.agency.co.uk")).toBe(true)
    expect(isValidBusinessEmail("info+sales@studio.io")).toBe(true)
  })

  test("rejects empty and malformed values", () => {
    expect(isValidBusinessEmail(null)).toBe(false)
    expect(isValidBusinessEmail("")).toBe(false)
    expect(isValidBusinessEmail("not-an-email")).toBe(false)
    expect(isValidBusinessEmail("missing@tld")).toBe(false)
    expect(isValidBusinessEmail("@nolocal.com")).toBe(false)
  })

  test("rejects known junk and placeholder domains", () => {
    expect(isValidBusinessEmail("a@example.com")).toBe(false)
    expect(isValidBusinessEmail("x@sentry.io")).toBe(false)
    expect(isValidBusinessEmail("foo@yourdomain.com")).toBe(false)
    expect(isValidBusinessEmail("bar@schema.org")).toBe(false)
  })

  test("rejects asset filenames mistaken for emails", () => {
    expect(isValidBusinessEmail("logo@2x.png")).toBe(false)
    expect(isValidBusinessEmail("icon@3x.svg")).toBe(false)
  })

  test("rejects IP-literal domains and hash-like localparts", () => {
    expect(isValidBusinessEmail("user@192.168.0.1")).toBe(false)
    expect(isValidBusinessEmail("a1b2c3d4e5f6a7b8@cdn.com")).toBe(false)
  })
})
