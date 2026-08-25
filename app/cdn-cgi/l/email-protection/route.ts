import { NextResponse } from "next/server"
import { publicSiteUrl } from "@/lib/site-urls"

export function GET() {
  return NextResponse.redirect(new URL("/contact", publicSiteUrl), 308)
}
