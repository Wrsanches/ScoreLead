import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getPlanStatus, serializePlanStatus } from "@/lib/plan"
import { resolveViewableBusiness } from "@/lib/active-business"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const access = await resolveViewableBusiness(session.user.id, null)
  const status = await getPlanStatus(access?.ownerUserId ?? session.user.id)
  return NextResponse.json(serializePlanStatus(status))
}
