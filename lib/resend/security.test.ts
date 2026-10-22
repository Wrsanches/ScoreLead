import { afterAll, expect, test } from "bun:test"
import {
  decryptResendSecret,
  encryptResendSecret,
  unsubscribeToken,
  verifyUnsubscribeToken,
  hasStoredUnsubscribeLink,
  matchesStoredUnsubscribeToken,
  unsubscribeMessageId,
} from "./security"

const previous = process.env.RESEND_TOKEN_ENCRYPTION_KEY
process.env.RESEND_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64")
afterAll(() => {
  if (previous === undefined) delete process.env.RESEND_TOKEN_ENCRYPTION_KEY
  else process.env.RESEND_TOKEN_ENCRYPTION_KEY = previous
})

test("secrets round-trip for their own business and fail elsewhere or when tampered", () => {
  const encrypted = encryptResendSecret("re_live_secret_key", "business-a")
  expect(encrypted).not.toContain("re_live_secret_key")
  expect(decryptResendSecret(encrypted, "business-a")).toBe("re_live_secret_key")
  expect(() => decryptResendSecret(encrypted, "business-b")).toThrow()
  const parts = encrypted.split(".")
  parts[3] = Buffer.from("tampered").toString("base64url")
  expect(() => decryptResendSecret(parts.join("."), "business-a")).toThrow()
  expect(() => decryptResendSecret("v0.a.b.c", "business-a")).toThrow()
})

test("unsubscribe tokens verify only when untouched", () => {
  const token = unsubscribeToken("msg_123")
  expect(verifyUnsubscribeToken(token)).toBe("msg_123")
  const [id, mac] = token.split(".")
  expect(verifyUnsubscribeToken(`${id}.${mac.slice(0, -2)}xx`)).toBeNull()
  expect(verifyUnsubscribeToken(`${Buffer.from("msg_999").toString("base64url")}.${mac}`)).toBeNull()
  expect(verifyUnsubscribeToken("garbage")).toBeNull()
  expect(verifyUnsubscribeToken(`${id}.${mac}.extra`)).toBeNull()
})

test("delivered unsubscribe links survive signing-key removal through exact saved snapshots", () => {
  const token = unsubscribeToken("msg_123")
  const snapshot = { id: "msg_123", html: `<a href="https://scorelead.com/u/${token}">Unsubscribe</a>`, text: null }
  const oldKey = process.env.RESEND_TOKEN_ENCRYPTION_KEY
  try {
    process.env.RESEND_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 10).toString("hex")
    expect(verifyUnsubscribeToken(token)).toBeNull()
    expect(hasStoredUnsubscribeLink(snapshot)).toBe(true)
    expect(matchesStoredUnsubscribeToken(token, snapshot)).toBe(true)
    expect(matchesStoredUnsubscribeToken(unsubscribeToken("msg_123"), snapshot)).toBe(false)
    expect(matchesStoredUnsubscribeToken(token, { ...snapshot, id: "msg_999" })).toBe(false)
    expect(matchesStoredUnsubscribeToken(token, { ...snapshot, html: snapshot.html.replace(token, token + "extra") })).toBe(false)
    expect(matchesStoredUnsubscribeToken(token, { ...snapshot, html: "", text: `Unsubscribe: https://scorelead.com/u/${token}\n` })).toBe(true)
  } finally { process.env.RESEND_TOKEN_ENCRYPTION_KEY = oldKey }
  for (const malformed of ["garbage", token + ".extra", token + "=", `${Buffer.from("../foo").toString("base64url")}.${token.split(".")[1]}`])
    expect(unsubscribeMessageId(malformed)).toBeNull()
})
