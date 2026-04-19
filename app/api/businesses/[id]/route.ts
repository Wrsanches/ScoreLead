import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

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

  const [row] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, id),
        eq(business.userId, session.user.id),
      ),
    )

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
  const body = await request.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const [row] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, id),
        eq(business.userId, session.user.id),
      ),
    )

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  await db
    .update(business)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(business.id, id))

  return NextResponse.json({ success: true })
}
