import { NextResponse } from "next/server"
import { processDiscoveryQueue } from "@/lib/jobs/discovery-queue"

/**
 * Cron-driven queue pump: requeues stalled jobs and runs claimable queued
 * ones. Point a scheduler at this (e.g. Vercel Cron, or `curl` from any
 * cron) every few minutes. Authenticated via CRON_SECRET as a Bearer token,
 * which is also what Vercel Cron sends automatically.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await processDiscoveryQueue()
  return NextResponse.json({ ok: true })
}
