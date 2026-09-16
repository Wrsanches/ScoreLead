import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business, contentPost } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getBusinessAccess } from "@/lib/business-access"
import { extForMime, getObjectBytes, keyFromUrl } from "@/lib/s3"

/**
 * Streams one slide image back through our origin with a Content-Disposition
 * header, so the browser saves it instead of opening the S3 URL in a tab.
 * The `download` attribute is ignored on cross-origin links, which is why
 * the viewer can't link to S3 directly.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; slideIndex: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, slideIndex } = await params
  const index = Number(slideIndex)
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid slide" }, { status: 400 })
  }

  const [post] = await db.select().from(contentPost).where(eq(contentPost.id, id))
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  const access = await getBusinessAccess(session.user.id, post.businessId)
  if (!access) return NextResponse.json({ error: "Post not found" }, { status: 404 })

  const image = post.images?.[index]
  const key = keyFromUrl(image?.url)
  if (!image || !key) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }
  const object = await getObjectBytes(key)
  if (!object) return NextResponse.json({ error: "Image not found" }, { status: 404 })

  const [biz] = await db
    .select({ name: business.name })
    .from(business)
    .where(eq(business.id, post.businessId))
  const stem = (biz?.name || "post")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "post"
  const day = new Date(post.scheduledFor).toISOString().slice(0, 10)
  const filename = `${stem}-${day}-slide-${index + 1}.${extForMime(object.contentType)}`

  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
