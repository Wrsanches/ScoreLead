import { NextResponse } from "next/server"
import { processDiscoveryQueue } from "@/lib/jobs/discovery-queue"
import { processContentPlanQueue } from "@/lib/jobs/content-plan-queue"

/**
 * Cron-driven queue pump: requeues stalled jobs and runs claimable queued
 * ones, for both the discovery and content-plan queues. Point a scheduler at
 * this (e.g. Vercel Cron, or `curl` from any cron) every few minutes.
 * Authenticated via CRON_SECRET as a Bearer token, which is also what Vercel
 * Cron sends automatically.
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

  // Independent queues - one failing must not strand the other.
  const [discovery, contentPlan] = await Promise.allSettled([
    processDiscoveryQueue(),
    processContentPlanQueue(),
  ])
  if (discovery.status === "rejected") {
    console.error("[jobs/pump] discovery queue failed:", discovery.reason)
  }
  if (contentPlan.status === "rejected") {
    console.error("[jobs/pump] content-plan queue failed:", contentPlan.reason)
  }

  return NextResponse.json({
    ok: true,
    discovery: discovery.status,
    contentPlan: contentPlan.status,
  })
}
