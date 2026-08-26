import { and, asc, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { resolveViewableBusiness } from "@/lib/active-business"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead } from "@/lib/db/schema"
import { can, getUserPlan } from "@/lib/plan"
import { CSV_BOM, csvList, csvRow } from "@/lib/services/csv"

/**
 * Export the active business's leads as CSV. Starter and up.
 *
 * Rows are streamed in pages rather than buffered: a business can hold
 * thousands of leads, and the widest columns (aiSummary) are long, so building
 * the whole file in memory first would be the one request that OOMs the box.
 * `websiteContent` (full scraped page text) and the nested scoreBreakdown /
 * googleReviews blobs are deliberately excluded - they would balloon the file
 * without being useful in a spreadsheet.
 */

const PAGE_SIZE = 500

const BASE_COLUMNS = [
  "Name",
  "Score",
  "Status",
  "Website",
  "Email",
  "All emails",
  "Phone",
  "All phones",
  "Address",
  "City",
  "State",
  "Country",
  "Google rating",
  "Google reviews",
  "Google Maps URL",
  "Instagram",
  "Owner name",
  "Industry",
  "Employees",
  "Revenue range",
  "Tech stack",
  "Services",
  "Year established",
  "Email verified",
  "Enrichment sources",
  "AI summary",
] as const

/** Serialize the decision-maker blob into one readable cell. */
function formatDecisionMakers(
  people: { name: string; title?: string; email?: string; linkedin?: string }[] | null,
): string {
  if (!people?.length) return ""
  return people
    .map((p) =>
      [p.name, p.title, p.email, p.linkedin].filter(Boolean).join(" | "),
    )
    .join(" ;; ")
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const access = await resolveViewableBusiness(
    session.user.id,
    url.searchParams.get("businessId"),
  )
  if (!access) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const plan = await getUserPlan(access.ownerUserId)
  if (!can(plan, "csvExport")) {
    return NextResponse.json(
      {
        error: "Upgrade to Starter to export your leads to CSV.",
        code: "PLAN_LIMIT",
        action: "csvExport",
      },
      { status: 402 },
    )
  }

  // Mirror the list endpoint's filter/sort contract so an export matches what
  // the user is looking at on screen.
  const statusFilter = url.searchParams.get("status") || "all"
  const sortBy = url.searchParams.get("sortBy") || "score"
  const sortOrder = url.searchParams.get("sortOrder") || "desc"

  const orderColumn =
    sortBy === "name" ? lead.name
    : sortBy === "createdAt" ? lead.createdAt
    : lead.score
  const orderFn = sortOrder === "asc" ? asc : desc

  const whereClause =
    statusFilter && statusFilter !== "all"
      ? and(eq(lead.businessId, access.businessId), eq(lead.status, statusFilter))
      : eq(lead.businessId, access.businessId)

  // Named decision-maker contacts are a Pro unlock, so the column only exists
  // for tiers that actually have the data.
  const includeDecisionMakers = can(plan, "decisionMakers")
  const columns = includeDecisionMakers
    ? [...BASE_COLUMNS, "Decision makers"]
    : [...BASE_COLUMNS]

  const encoder = new TextEncoder()
  let offset = 0
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(CSV_BOM + csvRow(columns)))
    },
    // Called once per chunk: page through on each call so memory stays bounded
    // by PAGE_SIZE rather than by the whole result set.
    async pull(controller) {
      const rows = await db
        .select()
        .from(lead)
        .where(whereClause)
        .orderBy(orderFn(orderColumn), asc(lead.id))
        .limit(PAGE_SIZE)
        .offset(offset)

      for (const row of rows) {
        const values = [
          row.name,
          row.score,
          row.status,
          row.website,
          row.email,
          csvList(row.emails),
          row.phone,
          csvList(row.phones),
          row.address,
          row.city,
          row.state,
          row.country,
          row.googleRating,
          row.googleReviewCount,
          row.googleMapsUrl,
          row.instagramHandle,
          row.ownerName,
          row.industry,
          row.employeeCount,
          row.revenueRange,
          csvList(row.techStack),
          csvList(row.services),
          row.yearEstablished,
          row.emailVerified ? "yes" : "no",
          csvList(row.enrichmentSources),
          row.aiSummary,
        ]
        if (includeDecisionMakers) {
          values.push(formatDecisionMakers(row.decisionMakers))
        }
        controller.enqueue(encoder.encode(csvRow(values)))
      }

      offset += rows.length
      if (rows.length < PAGE_SIZE) controller.close()
    },
  })

  const date = new Date().toISOString().slice(0, 10)
  const filename = `scorelead-leads-${date}.csv`

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
