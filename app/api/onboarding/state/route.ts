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

  const result = await db
    .select()
    .from(business)
    .where(eq(business.userId, session.user.id))
    .limit(1)

  const biz = result[0]

  if (!biz) {
    return NextResponse.json({ business: null })
  }

  return NextResponse.json({
    business: {
      website: biz.website || "",
      instagram: biz.instagram || "",
      facebook: biz.facebook || "",
      linkedin: biz.linkedin || "",
      other: biz.other || "",
      location: biz.location || "",
      name: biz.name || "",
      description: biz.description || "",
      persona: biz.persona || "",
      clientPersona: biz.clientPersona || "",
      field: biz.field || "",
      category: biz.category || "",
      tags: biz.tags || "",
      logo: biz.logo || "",
      onboardingStep: biz.onboardingStep,
    },
  })
}
