import { useId } from "react"
import { getSocialConfig, getSocialIconPath } from "@/components/admin/social-icon"

/**
 * Official-looking brand marks for integration surfaces: the glyph sits on a
 * rounded tile painted in the brand's own colors (Instagram's gradient,
 * WhatsApp's green). Other platforms get a tile in their brand color.
 */
export function BrandLogo({
  platform,
  className = "size-10",
}: {
  platform: string
  className?: string
}) {
  const gradientId = useId()
  const path = getSocialIconPath(platform) ?? ""

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden="true" role="img">
        <defs>
          <radialGradient id={gradientId} cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#FDF497" />
            <stop offset="5%" stopColor="#FDF497" />
            <stop offset="45%" stopColor="#FD5949" />
            <stop offset="60%" stopColor="#D6249F" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
        <path d={path} fill="#fff" transform="translate(9 9) scale(0.9167)" />
      </svg>
    )
  }

  if (platform === "resend") {
    // Resend's mark is black on white; on our dark canvas the tile needs a
    // faint edge so it does not dissolve into the background.
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden="true" role="img">
        <rect width="40" height="40" rx="11" fill="#18181B" />
        <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="none" stroke="rgba(255,255,255,0.18)" />
        {/* Resend's "R" mark, centered with a little breathing room on the tile. */}
        <path d={path} fill="#fff" transform="translate(10 10) scale(0.8333)" />
      </svg>
    )
  }

  const fill = platform === "whatsapp" ? "#25D366" : getSocialConfig(platform).color
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" role="img">
      <rect width="40" height="40" rx="11" fill={fill} />
      <path d={path} fill="#fff" transform="translate(9 9) scale(0.9167)" />
    </svg>
  )
}
