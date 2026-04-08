import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { suggestKeywords } from "@/lib/services/query-generator"

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { businessId } = body

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId is required" },
      { status: 400 },
    )
  }

  const [biz] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, businessId),
        eq(business.userId, session.user.id),
      ),
    )

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  // Return cached suggestions if available
  if (biz.suggestedKeywords && biz.suggestedKeywords.length > 0) {
    return NextResponse.json({
      keywords: biz.suggestedKeywords,
      lastKeywords: biz.lastDiscoveryKeywords || [],
    })
  }

  // Generate and cache
  const keywords = await suggestKeywords({
    name: biz.name,
    description: biz.description,
    persona: biz.persona,
    clientPersona: biz.clientPersona,
    field: biz.field,
    category: biz.category,
    tags: biz.tags,
    businessModel: biz.businessModel,
    services: biz.services,
    competitors: biz.competitors,
    language: biz.language,
  })

  // Save to business
  await db
    .update(business)
    .set({ suggestedKeywords: keywords, updatedAt: new Date() })
    .where(eq(business.id, businessId))

  return NextResponse.json({
    keywords,
    lastKeywords: biz.lastDiscoveryKeywords || [],
  })
}
