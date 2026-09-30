/** Bound provider payloads before buffering them, including chunked responses. */
export async function readLimitedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const length = Number(response.headers.get("content-length"))
  if (Number.isFinite(length) && length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE")
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) throw new Error("PAYLOAD_TOO_LARGE")
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return Buffer.concat(chunks)
}
