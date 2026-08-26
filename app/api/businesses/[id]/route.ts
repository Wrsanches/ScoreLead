import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { MAX_PRODUCT_IMAGES } from "@/lib/product-images"
import { deleteObject, isManagedUrl, keyFromUrl } from "@/lib/s3"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getBusinessAccess } from "@/lib/business-access"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const access = await getBusinessAccess(session.user.id, id)
  if (!access) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const [row] = await db
    .select()
    .from(business)
    .where(eq(business.id, id))

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  return NextResponse.json(row)
}

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Invalid hex color")

const optionalTrimmed = z.string().max(4000).optional()
const optionalShort = z.string().max(400).optional()

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: optionalTrimmed,
  persona: optionalTrimmed,
  clientPersona: optionalTrimmed,
  field: optionalShort,
  category: optionalShort,
  tags: optionalTrimmed,
  location: optionalShort,
  language: z.string().max(16).optional(),
  logo: z.string().max(100_000).optional(),
  productImages: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        url: z
          .string()
          .url()
          .max(2048)
          .refine(isManagedUrl, "Only uploaded images are allowed"),
        description: z.string().max(500),
      }),
    )
    .max(MAX_PRODUCT_IMAGES)
    .optional(),
  website: optionalShort,
  instagram: optionalShort,
  facebook: optionalShort,
  linkedin: optionalShort,
  other: optionalShort,
  services: optionalTrimmed,
  serviceArea: optionalShort,
  competitors: optionalTrimmed,
  brandStyle: optionalTrimmed,
  brandColorPrimary: hexColor.nullable().optional(),
  brandColorSecondary: hexColor.nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const access = await getBusinessAccess(session.user.id, id)
  if (!access || access.readOnly) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const [row] = await db
    .select()
    .from(business)
    .where(eq(business.id, id))

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  // New images must come from the authenticated actor's upload namespace.
  // Images already attached to this authorized business remain valid so an
  // admin can edit an owner's business (and the owner can later retain images
  // uploaded by the admin) without crossing into an unrelated tenant.
  const productPrefix = `business-products/${session.user.id}/`
  const existingProductUrls = new Set(
    (row.productImages ?? []).map((image) => image.url),
  )
  if (parsed.data.productImages) {
    const allOwned = parsed.data.productImages.every((img) => {
      const key = keyFromUrl(img.url)
      return (
        existingProductUrls.has(img.url) ||
        (key !== null && key.startsWith(productPrefix))
      )
    })
    if (!allOwned) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
    }
  }

  await db
    .update(business)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(business.id, id))

  // Best-effort cleanup of product images removed from this authorized row.
  if (parsed.data.productImages) {
    const keptUrls = new Set(parsed.data.productImages.map((img) => img.url))
    const removed = (row.productImages ?? []).filter(
      (img) => !keptUrls.has(img.url),
    )
    await Promise.all(
      removed.map((img) => {
        const key = keyFromUrl(img.url)
        if (!key) return null
        return deleteObject(key)
      }),
    )
  }

  return NextResponse.json({ success: true })
}
