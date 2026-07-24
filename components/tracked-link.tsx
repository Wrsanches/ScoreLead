"use client"

import type { ComponentProps, MouseEvent } from "react"
import { Link } from "@/i18n/routing"
import {
  trackMarketingEvent,
  type MarketingEventName,
} from "@/lib/analytics-events"

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
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackMarketingEvent(eventName, eventParams)
    if (props.href === "/signup") {
      trackMarketingEvent("signup_start", eventParams)
    }
    onClick?.(event)
  }

  return <Link {...props} onClick={handleClick} />
}
