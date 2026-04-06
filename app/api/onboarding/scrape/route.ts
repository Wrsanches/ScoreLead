import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { runOnboardingPipeline } from "@/lib/services/onboarding-pipeline"
import { z } from "zod"

const scrapeSchema = z.object({
  website: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  other: z.string().url().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = scrapeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const links = {
    website: parsed.data.website || undefined,
    instagram: parsed.data.instagram || undefined,
    facebook: parsed.data.facebook || undefined,
    linkedin: parsed.data.linkedin || undefined,
    other: parsed.data.other || undefined,
    location: parsed.data.location || undefined,
  }

  try {
    const profile = await runOnboardingPipeline(links)

    // Try to fetch logo from website favicon
    let logo: string | null = null
    if (links.website) {
      try {
        const domain = new URL(links.website).hostname
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
        const faviconRes = await fetch(faviconUrl)
        if (faviconRes.ok) {
          logo = faviconUrl
        }
      } catch {
        // Non-critical, skip
      }
    }

    // Upsert business record
    const existing = await db
      .select()
      .from(business)
      .where(eq(business.userId, session.user.id))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(business)
        .set({
          ...links,
          name: profile.name,
          description: profile.description,
          persona: profile.persona,
          clientPersona: profile.clientPersona,
          field: profile.field,
          category: profile.category,
          tags: JSON.stringify(profile.tags),
          logo,
          language: profile.language || null,
          onboardingStep: "review",
          updatedAt: new Date(),
        })
        .where(eq(business.userId, session.user.id))
    } else {
      await db.insert(business).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        ...links,
        name: profile.name,
        description: profile.description,
        persona: profile.persona,
        clientPersona: profile.clientPersona,
        field: profile.field,
        category: profile.category,
        tags: JSON.stringify(profile.tags),
        logo,
        language: profile.language || null,
        onboardingStep: "review",
      })
    }

    return NextResponse.json({ profile, logo })
  } catch (error) {
    console.error("[onboarding/scrape]", error)
    return NextResponse.json(
      { error: "Failed to process links. Please try again." },
      { status: 500 }
    )
  }
}
