"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Building2 } from "lucide-react"

/**
 * Google's favicon service never 404s cleanly for sites without an icon: it
 * answers with a generic 16x16 grey globe that browsers happily render. So a
 * business with no favicon used to show a globe instead of anything useful.
 * This avatar loads the logo or favicon and, when the image fails or comes
 * back as that 16px placeholder, falls back to a tinted tile with the
 * business initials. The tint is derived from the name so the same business
 * always gets the same colour.
 *
 * Dark marks on a transparent background are unreadable on the dark canvas,
 * so the avatar asks `/api/logo-meta` (server-side pixel analysis, because the
 * favicon host blocks canvas reads) and gives only those logos a white tile.
 */

interface LogoMeta {
  needsLightBacking: boolean
  placeholder: boolean
}

const NEUTRAL_META: LogoMeta = { needsLightBacking: false, placeholder: false }
const metaCache = new Map<string, Promise<LogoMeta>>()

function loadLogoMeta(src: string): Promise<LogoMeta> {
  let pending = metaCache.get(src)
  if (!pending) {
    pending = fetch(`/api/logo-meta?src=${encodeURIComponent(src)}`)
      .then((res) => (res.ok ? (res.json() as Promise<LogoMeta>) : NEUTRAL_META))
      .catch(() => NEUTRAL_META)
    metaCache.set(src, pending)
  }
  return pending
}

export function getFaviconUrl(website: string | null | undefined): string | null {
  if (!website) return null
  try {
    const domain = new URL(website).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return null
  }
}

export function getBusinessInitials(name: string | null | undefined): string {
  return (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

const TINTS = [
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
]

function tintFor(name: string | null | undefined): string {
  const s = name || ""
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

/** Google's "no icon" placeholder is always 16px, real icons come back larger. */
const PLACEHOLDER_MAX_PX = 16

export function BusinessAvatar({
  name,
  logo,
  website,
  size = 24,
  className = "",
  rounded = "rounded-md",
  textClassName = "text-[10px] font-semibold",
}: {
  name: string | null | undefined
  logo?: string | null
  website?: string | null
  /** Rendered box size in px; also used as the image `sizes` hint. */
  size?: number
  className?: string
  rounded?: string
  /** Typography for the initials fallback; scale with `size`. */
  textClassName?: string
}) {
  const src = logo || getFaviconUrl(website)
  const [failed, setFailed] = useState(false)
  const [lightBacking, setLightBacking] = useState(false)

  // A new source deserves a fresh attempt, and its own contrast check.
  useEffect(() => {
    setFailed(false)
    setLightBacking(false)
    if (!src) return
    let cancelled = false
    loadLogoMeta(src).then((meta) => {
      if (cancelled) return
      if (meta.placeholder) setFailed(true)
      setLightBacking(meta.needsLightBacking)
    })
    return () => {
      cancelled = true
    }
  }, [src])

  const box = { width: size, height: size }

  if (src && !failed) {
    // Only a dark mark on a transparent background gets the white tile, with
    // a small inset so it does not touch the edges. Everything else is shown
    // as-is: opaque logos bring their own backdrop.
    const inset = lightBacking ? Math.round(size * 0.1) : 0
    return (
      <span
        className={`relative block shrink-0 overflow-hidden ${
          lightBacking ? "bg-white ring-1 ring-black/10 ring-inset dark:ring-white/10" : ""
        } ${rounded} ${className}`}
        style={box}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          className={lightBacking ? "object-contain" : "object-cover"}
          style={inset ? { padding: inset } : undefined}
          unoptimized
          onError={() => setFailed(true)}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth > 0 && img.naturalWidth <= PLACEHOLDER_MAX_PX) {
              setFailed(true)
            }
          }}
        />
      </span>
    )
  }

  const initials = getBusinessInitials(name)

  return (
    <span
      className={`flex shrink-0 items-center justify-center ${rounded} ${
        initials ? tintFor(name) : "bg-zinc-200 text-zinc-500 dark:bg-white/[0.07]"
      } ${className}`}
      style={box}
      aria-hidden="true"
    >
      {initials ? (
        <span className={`leading-none tracking-tight ${textClassName}`}>{initials}</span>
      ) : (
        <Building2 style={{ width: size * 0.55, height: size * 0.55 }} />
      )}
    </span>
  )
}
