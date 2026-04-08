import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const businesses = await db
    .select({
      id: business.id,
      name: business.name,
      logo: business.logo,
      field: business.field,
      website: business.website,
      tags: business.tags,
      services: business.services,
      lastDiscoveryKeywords: business.lastDiscoveryKeywords,
      suggestedKeywords: business.suggestedKeywords,
    })
    .from(business)
    .where(eq(business.userId, session.user.id))

  return NextResponse.json(businesses)
}
