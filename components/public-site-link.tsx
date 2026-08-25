"use client"

import type { ComponentPropsWithoutRef } from "react"
import { useLocale } from "next-intl"
import { getLocalizedPublicUrl } from "@/lib/site-urls"

type PublicSiteLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string
}

/**
 * Uses a native browser navigation for links that leave app.scorelead.io.
 * Next.js client links would request an RSC payload from the app origin first,
 * then follow the host redirect cross-origin and be blocked by CORS.
 */
export function PublicSiteLink({ href, ...props }: PublicSiteLinkProps) {
  const locale = useLocale()
  return <a {...props} href={getLocalizedPublicUrl(href, locale)} />
}
