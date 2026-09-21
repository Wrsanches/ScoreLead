"use client"

import type { BrandTheme } from "@/lib/emails/blocks/theme"

/** Loads the business's brand web font so canvas and dialog previews match the sent email. */
export function BrandFontLink({ theme }: { theme: BrandTheme }) {
  if (!theme.webFontUrl) return null
  return <link rel="stylesheet" href={theme.webFontUrl} />
}
