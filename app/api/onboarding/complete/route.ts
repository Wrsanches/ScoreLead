import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { assertCanUse, PlanLimitError } from "@/lib/plan"

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
  brandColorPrimary: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
    .nullable()
    .optional(),
  brandColorSecondary: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
    .nullable()
    .optional(),
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

  const data = { ...parsed.data, businessModel: "b2b" }

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
    // Creating a brand-new business - gated by plan (Free = 1 business).
    try {
      await assertCanUse(session.user.id, "business")
    } catch (e) {
      if (e instanceof PlanLimitError) {
        return NextResponse.json(
          {
            error: "The Free plan includes 1 business. Upgrade to Pro to add more.",
            code: "PLAN_LIMIT",
            action: e.action,
          },
          { status: 402 },
        )
      }
      throw e
    }
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
