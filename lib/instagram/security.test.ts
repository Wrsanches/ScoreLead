import { afterAll, expect, test } from "bun:test"
import { createHmac } from "node:crypto"
import {
  decryptInstagramToken,
  encryptInstagramToken,
  signedInstagramUser,
  isSameOrigin,
} from "./security"
const previous = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY
process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
  "base64",
)
afterAll(() => {
  if (previous === undefined) delete process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY
  else process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = previous
})
test("tokens cannot be decrypted for another tenant or after tampering", () => {
  const encrypted = encryptInstagramToken("secret-test-token", "business-a")
  expect(encrypted).not.toContain("secret-test-token")
  expect(decryptInstagramToken(encrypted, "business-a")).toBe(
    "secret-test-token",
  )
  expect(() => decryptInstagramToken(encrypted, "business-b")).toThrow()
  const parts = encrypted.split(".")
  parts[3] = Buffer.from("tampered").toString("base64url")
  expect(() => decryptInstagramToken(parts.join("."), "business-a")).toThrow()
})
test("Meta callbacks require an authentic HMAC and expected algorithm", () => {
  const sign = (data: object) => {
    const encoded = Buffer.from(JSON.stringify(data)).toString("base64url")
    return `${createHmac("sha256", "test-secret").update(encoded).digest("base64url")}.${encoded}`
  }
  const signed = sign({ algorithm: "HMAC-SHA256", user_id: "123" })
  expect(signedInstagramUser(signed, "test-secret")).toBe("123")
  expect(signedInstagramUser(signed, "wrong-secret")).toBeNull()
  expect(
    signedInstagramUser(
      sign({ algorithm: "none", user_id: "123" }),
      "test-secret",
    ),
  ).toBeNull()
})
test("write requests require the same origin", () => {
  expect(
    isSameOrigin(
      new Request("https://app.scorelead.io/api/test", {
        headers: { Origin: "https://attacker.example" },
      }),
    ),
  ).toBe(false)
  expect(
    isSameOrigin(
      new Request("https://app.scorelead.io/api/test", {
        headers: { Origin: "https://app.scorelead.io" },
      }),
    ),
  ).toBe(true)
})
