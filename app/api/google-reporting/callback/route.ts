import { reportingIntegrationPath } from "@/lib/google-reporting/paths"
import { NextResponse } from "next/server"
import { reportingSession, reportingAccess } from "@/lib/google-reporting/http"
import {
  consumeGoogleState,
  saveGoogleConnection,
} from "@/lib/google-reporting/data"
import { exchangeGoogleCode, googleIdentity } from "@/lib/google-reporting/api"
import {
  ReportingError,
  reportingErrorResponse,
} from "@/lib/google-reporting/errors"
import {
  googleReportingAvailableTo,
  reportingOrigin,
} from "@/lib/google-reporting/config"
import { getLocalizedAppPath } from "@/lib/site-urls"
export async function GET(request: Request) {
  try {
    const session = await reportingSession(request)
    const url = new URL(request.url)
    const state = await consumeGoogleState(
      url.searchParams.get("state") || "",
      session.user.id,
    )
    const destination = new URL(
      getLocalizedAppPath(
        reportingIntegrationPath(state.provider, state.businessId),
        state.locale,
      ),
      reportingOrigin(),
    )
    let outcome = "connected"
    try {
      await reportingAccess(request, state.businessId)
      if (!googleReportingAvailableTo(session.user))
        throw new ReportingError("REPORTING_NOT_CONFIGURED", 503)
      if (url.searchParams.has("error"))
        throw new ReportingError("AUTH_CANCELLED")
      const code = url.searchParams.get("code")
      if (!code || code.length > 4096) throw new ReportingError("AUTH_FAILED")
      const tokens = await exchangeGoogleCode(
        code,
        state.verifier,
        state.provider,
      )
      const identity = await googleIdentity(tokens.access_token)
      await saveGoogleConnection({
        businessId: state.businessId,
        userId: session.user.id,
        provider: state.provider,
        subject: identity.sub,
        email: identity.email,
        tokens,
      })
    } catch (error) {
      outcome = error instanceof ReportingError ? error.code : "AUTH_FAILED"
    }
    destination.searchParams.set("google", outcome)
    return NextResponse.redirect(destination, {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
