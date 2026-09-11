import { rateLimit } from "@/lib/rate-limit"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { contentPost } from "@/lib/db/schema"
import { instagramAccess, publishingResponse } from "@/lib/instagram/http"
import { getPublication, publicPublication } from "@/lib/instagram/data"
import {
  scheduleInstagramPost,
  cancelInstagramPost,
} from "@/lib/instagram/schedule"
import { PublishingError } from "@/lib/instagram/validation"

export const maxDuration = 120
const scheduleSchema = z.object({
  scheduledFor: z.string().datetime(),
  timeZone: z.string().min(1).max(100),
  expectedUpdatedAt: z.string().datetime(),
})
async function authorize(request: Request, id: string, write: boolean) {
  const [post] = await db
    .select({ businessId: contentPost.businessId })
    .from(contentPost)
    .where(eq(contentPost.id, id))
  if (!post) throw new PublishingError("POST_NOT_FOUND", 404)
  const scope = await instagramAccess(request, post.businessId, write)
  if (
    write &&
    !rateLimit(`instagram-publish:${scope.session.user.id}`, 10, 60_000).allowed
  )
    throw new PublishingError("RATE_LIMITED", 429)
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await authorize(request, id, false)
    return NextResponse.json({
      publication: publicPublication(await getPublication(id)),
    })
  } catch (error) {
    return publishingResponse(error)
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await authorize(request, id, true)
    const parsed = scheduleSchema.safeParse(
      await request.json().catch(() => null),
    )
    if (!parsed.success) throw new PublishingError("INVALID_SCHEDULE")
    const { scheduledFor, timeZone, expectedUpdatedAt } = parsed.data
    const publication = await scheduleInstagramPost(
      id,
      scheduledFor,
      timeZone,
      expectedUpdatedAt,
    )
    return NextResponse.json(
      { publication: publicPublication(publication) },
      { status: 201 },
    )
  } catch (error) {
    return publishingResponse(error)
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await authorize(request, id, true)
    return NextResponse.json({
      publication: publicPublication(await cancelInstagramPost(id)),
    })
  } catch (error) {
    return publishingResponse(error)
  }
}
