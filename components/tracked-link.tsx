"use client"

import type { ComponentProps, MouseEvent } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/routing"
import {
  trackMarketingEvent,
  type MarketingEventName,
} from "@/lib/analytics-events"
import { isAppPath } from "@/lib/host-routing"
import { getAppLinkHref } from "@/lib/site-urls"
import { useCurrentOrigin } from "@/lib/use-current-origin"

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName: MarketingEventName
  eventParams?: Record<string, string | number | boolean | undefined>
}

export function TrackedLink({
  eventName,
  eventParams,
  onClick,
  ...props
}: TrackedLinkProps) {
  const locale = useLocale()
  const origin = useCurrentOrigin()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackMarketingEvent(eventName, eventParams)
    if (props.href === "/signup") {
      trackMarketingEvent("signup_start", eventParams)
    }
    onClick?.(event)
  }

  if (typeof props.href === "string" && isAppPath(props.href)) {
    const {
      href: _href,
      locale: _locale,
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      ...anchorProps
    } = props
    return (
      <a
        {...(anchorProps as ComponentProps<"a">)}
        href={getAppLinkHref(props.href, locale, origin)}
        onClick={handleClick}
      />
    )
  }

  return <Link {...props} onClick={handleClick} />
}
