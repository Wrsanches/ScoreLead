import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPost } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { removePublicImage } from "@/lib/services/content-image-generator"

const patchSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  postType: z.enum(["single", "carousel", "reel", "story"]).optional(),
  pillar: z
    .enum(["educate", "showcase", "story", "proof", "engagement"])
    .nullable()
    .optional(),
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string()).optional(),
  visualIdea: z.string().nullable().optional(),
  callToAction: z.string().nullable().optional(),
  status: z.enum(["draft", "approved"]).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(contentPost)
    .where(and(eq(contentPost.id, id), eq(contentPost.userId, session.user.id)))

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  const p = parsed.data
  if (p.scheduledFor !== undefined) update.scheduledFor = new Date(p.scheduledFor)
  if (p.postType !== undefined) update.postType = p.postType
  if (p.pillar !== undefined) update.pillar = p.pillar
  if (p.caption !== undefined) update.caption = p.caption
  if (p.hashtags !== undefined) update.hashtags = p.hashtags
  if (p.visualIdea !== undefined) update.visualIdea = p.visualIdea
  if (p.callToAction !== undefined) update.callToAction = p.callToAction
  if (p.status !== undefined) update.status = p.status

  await db.update(contentPost).set(update).where(eq(contentPost.id, id))

  const [updated] = await db
    .select()
    .from(contentPost)
    .where(eq(contentPost.id, id))

  return NextResponse.json({ post: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [existing] = await db
    .select()
    .from(contentPost)
    .where(and(eq(contentPost.id, id), eq(contentPost.userId, session.user.id)))

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const existingImages = existing.images ?? []
  await db.delete(contentPost).where(eq(contentPost.id, id))
  await Promise.all(existingImages.map((img) => removePublicImage(img.url)))
  return NextResponse.json({ success: true })
}
