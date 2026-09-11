import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBusinessAccess } from "@/lib/business-access"
import { PublishingError } from "./validation"
import { isSameOrigin } from "./security"

export async function instagramAccess(
  request: Request,
  businessId: string,
  write = false,
) {
  if (write && !isSameOrigin(request))
    throw new PublishingError("INVALID_ORIGIN", 403)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new PublishingError("UNAUTHORIZED", 401)
  const access = await getBusinessAccess(session.user.id, businessId)
  if (!access || (write && access.readOnly))
    throw new PublishingError("BUSINESS_NOT_FOUND", 404)
  return { session, access }
}
export function publishingResponse(error: unknown) {
  if (error instanceof PublishingError)
    return NextResponse.json(
      { error: error.code, code: error.code },
      { status: error.status },
    )
  return NextResponse.json(
    { error: "INSTAGRAM_REQUEST_FAILED", code: "INSTAGRAM_REQUEST_FAILED" },
    { status: 502 },
  )
}

export async function withPublishingErrors<T>(run: () => Promise<T>) {
  try {
    return await run()
  } catch (error) {
    if (error instanceof PublishingError) return publishingResponse(error)
    throw error
  }
}
