"use client"

import { useSyncExternalStore, type ComponentPropsWithoutRef } from "react"
import { useLocale } from "next-intl"
import { getPublicSiteLinkHref } from "@/lib/site-urls"

type PublicSiteLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string
}

function subscribeToOrigin() {
  return () => {}
}

function getBrowserOrigin() {
  return window.location.origin
}

function getServerOrigin() {
  return ""
}

/**
 * Uses a native browser navigation for links that leave app.scorelead.io.
 * Next.js client links would request an RSC payload from the app origin first,
 * then follow the host redirect cross-origin and be blocked by CORS.
 */
export function PublicSiteLink({ href, ...props }: PublicSiteLinkProps) {
  const locale = useLocale()
  const currentOrigin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  )

  return (
    <a
      {...props}
      href={getPublicSiteLinkHref(href, locale, currentOrigin)}
    />
  )
}
