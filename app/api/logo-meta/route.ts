import { headers } from "next/headers"
import { NextResponse } from "next/server"
import sharp from "sharp"
import { auth } from "@/lib/auth"
import { isManagedUrl } from "@/lib/s3"
import { analyzeLogoContrast } from "@/lib/logo-contrast"

/**
 * Tells the client how a business logo will read on the dark canvas.
 *
 * The browser cannot inspect these pixels itself: Google's favicon service
 * sends no CORS headers, so a canvas read would be tainted. We fetch the
 * image here, downsample it, and report whether it is a dark mark on a
 * transparent background (needs a white tile) or Google's 16px "no icon"
 * placeholder (should fall back to initials).
 *
 * Only our own S3/CDN and Google's favicon hosts are fetched, so this cannot
 * be used to probe arbitrary URLs.
 */

export interface LogoMeta {
  needsLightBacking: boolean
  placeholder: boolean
}

const GOOGLE_HOSTS = /^(www\.google\.com|t\d\.gstatic\.com)$/
const PLACEHOLDER_MAX_PX = 16
const MAX_BYTES = 2 * 1024 * 1024
const FETCH_TIMEOUT_MS = 5000

const cache = new Map<string, LogoMeta>()
const CACHE_LIMIT = 2000

function isAllowed(src: string): boolean {
  try {
    const url = new URL(src)
    if (url.protocol !== "https:") return false
    return GOOGLE_HOSTS.test(url.hostname) || isManagedUrl(src)
  } catch {
    return false
  }
}

function remember(src: string, meta: LogoMeta): LogoMeta {
  if (cache.size >= CACHE_LIMIT) {
    const first = cache.keys().next().value
    if (first !== undefined) cache.delete(first)
  }
  cache.set(src, meta)
  return meta
}

const NEUTRAL: LogoMeta = { needsLightBacking: false, placeholder: false }

async function inspect(src: string): Promise<LogoMeta> {
  const cached = cache.get(src)
  if (cached) return cached

  const res = await fetch(src, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: "image/*" },
  })
  // Google answers 404 with a grey globe body for sites without an icon.
  if (res.status === 404) return remember(src, { needsLightBacking: false, placeholder: true })
  if (!res.ok) return NEUTRAL

  const length = Number(res.headers.get("content-length") ?? 0)
  if (length > MAX_BYTES) return NEUTRAL
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return NEUTRAL

  const image = sharp(buf, { animated: false })
  const meta = await image.metadata()
  const placeholder = Boolean(meta.width && meta.width <= PLACEHOLDER_MAX_PX)

  const { data, info } = await image
    .resize(48, 48, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const contrast = analyzeLogoContrast(data, info.width, info.height)

  return remember(src, { needsLightBacking: contrast.needsLightBacking, placeholder })
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const src = new URL(request.url).searchParams.get("src")
  if (!src || !isAllowed(src)) {
    return NextResponse.json({ error: "Unsupported image source" }, { status: 400 })
  }

  try {
    const meta = await inspect(src)
    return NextResponse.json(meta, {
      headers: { "Cache-Control": "private, max-age=86400" },
    })
  } catch {
    // Never block the UI on this; the avatar just renders without a backing.
    return NextResponse.json(NEUTRAL, {
      headers: { "Cache-Control": "private, max-age=3600" },
    })
  }
}
