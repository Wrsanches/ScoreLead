/**
 * Simple in-memory per-key rate limit.
 * Use for "expensive third-party calls per user" guards, not for DDoS protection.
 */

interface Bucket {
  windowStart: number
  count: number
}

const BUCKETS = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const bucket = BUCKETS.get(key)
  if (!bucket || now - bucket.windowStart >= windowMs) {
    BUCKETS.set(key, { windowStart: now, count: 1 })
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 }
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - bucket.windowStart),
    }
  }
  bucket.count += 1
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterMs: 0,
  }
}
