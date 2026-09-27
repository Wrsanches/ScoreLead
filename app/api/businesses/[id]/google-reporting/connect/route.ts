import { z } from "zod"
import {
  reportingAccess,
  jsonBody,
  noStoreJson,
} from "@/lib/google-reporting/http"
import {
  reportingErrorResponse,
  ReportingError,
} from "@/lib/google-reporting/errors"
import { googleReportingAvailableTo } from "@/lib/google-reporting/config"
import { beginGoogleConnection } from "@/lib/google-reporting/data"
import { providerSchema } from "@/lib/google-reporting/validation"
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await reportingAccess(request, id, true)
    if (!googleReportingAvailableTo(session.user))
      throw new ReportingError("REPORTING_NOT_CONFIGURED", 503)
    const body = await jsonBody(
      request,
      z
        .object({
          provider: providerSchema,
          locale: z.enum(["en", "pt", "es"]).default("en"),
        })
        .strict(),
    )
    return noStoreJson({
      url: await beginGoogleConnection(
        session.user.id,
        id,
        body.provider,
        body.locale,
      ),
    })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
