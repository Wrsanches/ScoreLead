import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { resolveViewableBusiness } from "@/lib/active-business"
import { getDashboardStats } from "@/lib/dashboard-stats"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const access = await resolveViewableBusiness(
    session.user.id,
    url.searchParams.get("businessId"),
  )
  if (!access) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }
  return NextResponse.json(await getDashboardStats(access.businessId))
}
