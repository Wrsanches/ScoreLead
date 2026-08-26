import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { extractBrandProfile } from "@/lib/services/brand-extractor"
import { getBusinessAccess } from "@/lib/business-access"

export async function POST(
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
  if (!access || access.readOnly) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const [row] = await db
    .select()
    .from(business)
    .where(eq(business.id, id))

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (!row.website) {
    return NextResponse.json(
      { error: "This business has no website URL on file." },
      { status: 400 },
    )
  }

  try {
    const brand = await extractBrandProfile(row.website)

    await db
      .update(business)
      .set({
        brandColors: brand.brandColors,
        brandFonts: brand.brandFonts,
        brandStyle: brand.brandStyle,
        updatedAt: new Date(),
      })
      .where(eq(business.id, id))

    return NextResponse.json(brand)
  } catch (error) {
    console.error("[businesses/brand]", error)
    return NextResponse.json(
      { error: "Failed to extract brand. Please try again." },
      { status: 500 },
    )
  }
}
