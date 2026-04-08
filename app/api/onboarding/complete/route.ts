import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

const completeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  persona: z.string().optional().or(z.literal("")),
  clientPersona: z.string().optional().or(z.literal("")),
  field: z.string().min(1),
  category: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  other: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  language: z.string().optional().or(z.literal("")),
  businessModel: z.string().optional().or(z.literal("")),
  services: z.string().optional().or(z.literal("")),
  serviceArea: z.string().optional().or(z.literal("")),
  competitors: z.string().optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = completeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const data = parsed.data

  const existing = await db
    .select()
    .from(business)
    .where(eq(business.userId, session.user.id))

  const inProgress = existing.find(b => !b.onboardingCompleted)

  if (inProgress) {
    await db
      .update(business)
      .set({
        ...data,
        onboardingCompleted: true,
        onboardingStep: "completed",
        updatedAt: new Date(),
      })
      .where(eq(business.id, inProgress.id))
  } else {
    await db.insert(business).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      ...data,
      onboardingCompleted: true,
      onboardingStep: "completed",
    })
  }

  return NextResponse.json({ success: true })
}
