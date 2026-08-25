import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { createHmac } from "node:crypto"
import {
  decryptWhatsAppToken,
  encryptWhatsAppToken,
  isE164,
  verifyMetaWebhookSignature,
} from "./security"

const previousEncryptionKey = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY
const previousMetaSecret = process.env.META_APP_SECRET

describe("WhatsApp security", () => {
  beforeEach(() => {
    process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")
    process.env.META_APP_SECRET = "test-meta-secret"
  })

  afterEach(() => {
    process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = previousEncryptionKey
    process.env.META_APP_SECRET = previousMetaSecret
  })

  test("encrypts tokens with a random authenticated envelope", () => {
    const first = encryptWhatsAppToken("business-token")
    const second = encryptWhatsAppToken("business-token")
    expect(first).not.toBe(second)
    expect(decryptWhatsAppToken(first)).toBe("business-token")
    expect(decryptWhatsAppToken(second)).toBe("business-token")
  })

  test("rejects a tampered encrypted token", () => {
    const encrypted = encryptWhatsAppToken("business-token")
    const envelope = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8"))
    // Tamper at the byte level. Rewriting the last base64 character is not
    // enough: the final character of a base64 group carries unused low bits, so
    // replacing it can decode to the identical bytes and the "tampered" value
    // then verifies correctly. Flipping a byte always changes the ciphertext.
    const raw = Buffer.from(envelope.ciphertext, "base64url")
    raw[0] ^= 0xff
    envelope.ciphertext = raw.toString("base64url")
    const tampered = Buffer.from(JSON.stringify(envelope)).toString("base64url")
    expect(() => decryptWhatsAppToken(tampered)).toThrow()
  })

  test("verifies Meta webhook signatures", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" })
    const signature = createHmac("sha256", "test-meta-secret").update(body).digest("hex")
    expect(verifyMetaWebhookSignature(body, `sha256=${signature}`)).toBe(true)
    expect(verifyMetaWebhookSignature(`${body}x`, `sha256=${signature}`)).toBe(false)
  })

  test("requires canonical E.164 numbers", () => {
    expect(isE164("+5511999999999")).toBe(true)
    expect(isE164("5511999999999")).toBe(false)
    expect(isE164("+0123456789")).toBe(false)
  })
})
