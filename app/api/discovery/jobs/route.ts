import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const jobs = await db
    .select()
    .from(discoveryJob)
    .where(eq(discoveryJob.userId, session.user.id))
    .orderBy(desc(discoveryJob.createdAt))

  return NextResponse.json(jobs)
}
