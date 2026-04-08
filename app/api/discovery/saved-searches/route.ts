import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { savedSearch, business } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  country: z.string().min(1),
  state: z.string().nullable(),
  city: z.string().nullable(),
  location: z.string().min(1),
  keywords: z.array(z.string()).min(1),
})

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searches = await db
    .select()
    .from(savedSearch)
    .where(eq(savedSearch.userId, session.user.id))
    .orderBy(desc(savedSearch.createdAt))

  return NextResponse.json(searches)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Verify business ownership
  const [biz] = await db
    .select({ id: business.id })
    .from(business)
    .where(
      and(
        eq(business.id, data.businessId),
        eq(business.userId, session.user.id),
      ),
    )

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const id = crypto.randomUUID()

  await db.insert(savedSearch).values({
    id,
    businessId: data.businessId,
    userId: session.user.id,
    name: data.name,
    country: data.country,
    state: data.state,
    city: data.city,
    location: data.location,
    keywords: data.keywords,
  })

  const [created] = await db
    .select()
    .from(savedSearch)
    .where(eq(savedSearch.id, id))

  return NextResponse.json(created, { status: 201 })
}
