import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBusinessAccess } from "@/lib/business-access"

export async function scopeGitHubRoute(businessId: string, mode: "view" | "manage" = "manage") {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  const access = await getBusinessAccess(session.user.id, businessId)
  if (!access || (mode === "manage" && access.readOnly)) return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) } as const
  return { session, access } as const
}
