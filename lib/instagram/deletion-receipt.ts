import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

function signature(nonce: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`instagram-data-deletion-completed:${nonce}`).digest("hex")
}

/** Issued only after erasure commits; the receipt contains no account identifier. */
export function createDeletionReceipt(secret: string) {
  const nonce = randomBytes(16).toString("hex")
  return nonce + signature(nonce, secret)
}

export function validDeletionReceipt(code: string, secret: string) {
  if (!/^[a-f0-9]{96}$/.test(code)) return false
  return timingSafeEqual(
    Buffer.from(code.slice(32), "hex"),
    Buffer.from(signature(code.slice(0, 32), secret), "hex"),
  )
}
