import { after } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business, discoveryJob } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { runDiscoveryJob } from "@/lib/services/discovery-pipeline"

const startJobSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  country: z.string().min(1),
  state: z.string().nullable(),
  city: z.string().nullable(),
  location: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  maxResults: z.number().min(1).max(500),
  serviceArea: z.enum(["local", "regional", "national"]),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = startJobSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  const [biz] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, data.businessId),
        eq(business.userId, session.user.id),
        eq(business.onboardingCompleted, true),
      ),
    )

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  // Save keywords for next time
  await db
    .update(business)
    .set({ lastDiscoveryKeywords: data.keywords, updatedAt: new Date() })
    .where(eq(business.id, data.businessId))

  const jobId = crypto.randomUUID()

  await db.insert(discoveryJob).values({
    id: jobId,
    businessId: data.businessId,
    userId: session.user.id,
    name: data.name,
    country: data.country,
    state: data.state,
    city: data.city,
    location: data.location,
    keywords: JSON.stringify(data.keywords),
    maxResults: data.maxResults,
    serviceArea: data.serviceArea,
    status: "queued",
  })

  // Run the pipeline in the background
  after(async () => {
    try {
      await runDiscoveryJob(jobId, {
        business: {
          id: biz.id,
          name: biz.name,
          description: biz.description,
          persona: biz.persona,
          clientPersona: biz.clientPersona,
          field: biz.field,
          category: biz.category,
          tags: biz.tags,
          businessModel: biz.businessModel,
          services: biz.services,
          serviceArea: biz.serviceArea,
          location: biz.location,
          language: biz.language,
          competitors: biz.competitors,
          website: biz.website,
        },
        keywords: data.keywords,
        location: data.location,
        maxResults: data.maxResults,
      })
    } catch (error) {
      console.error("[discovery-job] failed:", error)
    }
  })

  return NextResponse.json({ jobId }, { status: 202 })
}
