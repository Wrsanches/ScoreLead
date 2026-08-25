import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import { routing } from "./i18n/routing"
import { getHostRedirect, getHostname } from "./lib/host-routing"

const intlMiddleware = createMiddleware(routing)

export default function proxy(request: import("next/server").NextRequest) {
  const publicUrl = (
    process.env.NEXT_PUBLIC_SCORELEAD_PUBLIC_URL ?? "https://scorelead.io"
  ).replace(/\/+$/, "")
  const appUrl = (
    process.env.NEXT_PUBLIC_SCORELEAD_APP_URL ?? "https://app.scorelead.io"
  ).replace(/\/+$/, "")
  const hostname = getHostname(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  )

  if (request.nextUrl.pathname === "/robots.txt") {
    if (hostname === new URL(appUrl).hostname) {
      return new NextResponse("User-agent: *\nDisallow: /\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }
    return NextResponse.next()
  }

  if (request.nextUrl.pathname === "/sitemap.xml") {
    if (hostname === new URL(appUrl).hostname) {
      return new NextResponse("Not found", { status: 404 })
    }
    return NextResponse.next()
  }

  const destination = getHostRedirect({
    hostname,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    publicUrl,
    appUrl,
  })

  if (destination) {
    return NextResponse.redirect(destination, 308)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    "/robots.txt",
    "/sitemap.xml",
    "/((?!api|cdn-cgi|_next|_vercel|.*\\..*).*)",
  ],
}
