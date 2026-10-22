import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

export const integrationKeyVariables = {
  reporting: "GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY",
  instagram: "INSTAGRAM_TOKEN_ENCRYPTION_KEY",
  resend: "RESEND_TOKEN_ENCRYPTION_KEY",
  whatsapp: "WHATSAPP_TOKEN_ENCRYPTION_KEY",
  github: "GITHUB_TOKEN_ENCRYPTION_KEY",
} as const

export type IntegrationPurpose = keyof typeof integrationKeyVariables
type EncryptionKey = { id: string; bytes: Buffer }
export type IntegrationKeyring = {
  current: EncryptionKey
  previous: EncryptionKey[]
}

const invalid = () => new Error("INVALID_INTEGRATION_CIPHERTEXT")
const keyId = (key: Buffer) => createHash("sha256").update(key).digest("hex").slice(0, 32)

function decodeKey(raw: string): EncryptionKey {
  const value = raw.trim()
  let bytes: Buffer
  if (/^[a-f\d]{64}$/i.test(value)) bytes = Buffer.from(value, "hex")
  else {
    if (!/^[A-Za-z0-9+/_-]{43}=?$/.test(value)) throw new Error("INVALID_INTEGRATION_KEY")
    bytes = Buffer.from(value, "base64")
    const canonical = value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    if (bytes.toString("base64url") !== canonical) throw new Error("INVALID_INTEGRATION_KEY")
  }
  if (bytes.length !== 32) throw new Error("INVALID_INTEGRATION_KEY")
  return { id: keyId(bytes), bytes }
}

/** Previous keys are decrypt-only. GitHub's existing WhatsApp fallback includes its keyring. */
export function integrationKeyring(purpose: IntegrationPurpose, env: Record<string, string | undefined> = process.env): IntegrationKeyring {
  const configured = integrationKeyVariables[purpose]
  const primary = purpose === "github" && !env[configured]
    ? integrationKeyVariables.whatsapp
    : configured
  const current = decodeKey(env[primary] || "")
  const previousVariables = new Set([primary.replace(/_KEY$/, "_PREVIOUS_KEYS")])
  if (purpose === "github") previousVariables.add("GITHUB_TOKEN_ENCRYPTION_PREVIOUS_KEYS")
  const values = [...previousVariables].flatMap((name) => {
    const value = env[name]
    return value?.trim() ? value.split(",") : []
  })
  if (values.length > 5) throw new Error("TOO_MANY_PREVIOUS_INTEGRATION_KEYS")
  const previous = values.map(decodeKey)
  if (new Set([current.id, ...previous.map((entry) => entry.id)]).size !== previous.length + 1)
    throw new Error("DUPLICATE_INTEGRATION_KEY")
  return { current, previous }
}

/** Keep legacy writers until every running instance can read both formats/keys. */
export function integrationWriteVersion(): 1 | 2 {
  const value = process.env.TOKEN_ENCRYPTION_WRITE_VERSION || "1"
  if (value !== "1" && value !== "2") throw new Error("INVALID_TOKEN_ENCRYPTION_WRITE_VERSION")
  return Number(value) as 1 | 2
}

function legacyAad(purpose: IntegrationPurpose, context: string) {
  return purpose === "whatsapp" ? undefined : Buffer.from(purpose === "github" ? `github:${context}` : context)
}

function versionedAad(purpose: IntegrationPurpose, context: string, id: string) {
  return Buffer.from(JSON.stringify(["scorelead-token-v2", purpose, id, context]))
}

type Envelope = { version: 1 | 2; id?: string; iv: Buffer; tag: Buffer; data: Buffer }

function decodePart(value: unknown, length?: number) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]*$/.test(value)) throw invalid()
  const decoded = Buffer.from(value, "base64url")
  if (decoded.toString("base64url") !== value || (length !== undefined && decoded.length !== length)) throw invalid()
  return decoded
}

function parseEnvelope(value: string, purpose: IntegrationPurpose): Envelope {
  if (value.length > 1024 * 1024) throw invalid()
  if (value.startsWith("v2.")) {
    const parts = value.split(".")
    if (parts.length !== 5 || !/^[a-f\d]{32}$/.test(parts[1])) throw invalid()
    return { version: 2, id: parts[1], iv: decodePart(parts[2], 12), tag: decodePart(parts[3], 16), data: decodePart(parts[4]) }
  }
  if (purpose === "whatsapp") {
    try {
      const envelope = JSON.parse(decodePart(value).toString("utf8"))
      if (envelope.v !== 1) throw invalid()
      return { version: 1, iv: decodePart(envelope.iv, 12), tag: decodePart(envelope.tag, 16), data: decodePart(envelope.ciphertext) }
    } catch { throw invalid() }
  }
  const parts = value.split(".")
  if (parts.length !== 4 || parts[0] !== "v1") throw invalid()
  return { version: 1, iv: decodePart(parts[1], 12), tag: decodePart(parts[2], 16), data: decodePart(parts[3]) }
}

export function integrationEnvelopeKeyId(value: string, purpose: IntegrationPurpose): string | null {
  return parseEnvelope(value, purpose).id ?? null
}

export function encryptIntegrationValue(
  purpose: IntegrationPurpose,
  plaintext: string,
  context = "",
  options: { version?: 1 | 2; keyring?: IntegrationKeyring } = {},
) {
  const ring = options.keyring ?? integrationKeyring(purpose)
  const version = options.version ?? integrationWriteVersion()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", ring.current.bytes, iv, { authTagLength: 16 })
  const aad = version === 2 ? versionedAad(purpose, context, ring.current.id) : legacyAad(purpose, context)
  if (aad) cipher.setAAD(aad)
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]).toString("base64url")
  const tag = cipher.getAuthTag().toString("base64url")
  if (version === 2) return ["v2", ring.current.id, iv.toString("base64url"), tag, data].join(".")
  if (purpose === "whatsapp") return Buffer.from(JSON.stringify({ v: 1, iv: iv.toString("base64url"), tag, ciphertext: data })).toString("base64url")
  return ["v1", iv.toString("base64url"), tag, data].join(".")
}

export function decryptIntegrationValue(
  purpose: IntegrationPurpose,
  value: string,
  context = "",
  ring = integrationKeyring(purpose),
) {
  const envelope = parseEnvelope(value, purpose)
  const keys = [ring.current, ...ring.previous]
  const candidates = envelope.version === 2 ? keys.filter((key) => key.id === envelope.id) : keys
  for (const key of candidates) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", key.bytes, envelope.iv, { authTagLength: 16 })
      const aad = envelope.version === 2 ? versionedAad(purpose, context, key.id) : legacyAad(purpose, context)
      if (aad) decipher.setAAD(aad)
      decipher.setAuthTag(envelope.tag)
      return Buffer.concat([decipher.update(envelope.data), decipher.final()]).toString("utf8")
    } catch { /* Legacy values have no key id: authenticate against the bounded keyring. */ }
  }
  throw invalid()
}
