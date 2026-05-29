import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  image: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal("")),
})

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { name, image } = parsed.data

  const [updated] = await db
    .update(user)
    .set({
      name,
      image: image ? image : null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id))
    .returning()

  return NextResponse.json({ success: true, user: updated })
}
