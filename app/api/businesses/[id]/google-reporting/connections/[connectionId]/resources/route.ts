import { z } from "zod"
import {
  reportingAccess,
  jsonBody,
  noStoreJson,
} from "@/lib/google-reporting/http"
import { reportingErrorResponse } from "@/lib/google-reporting/errors"
import {
  discoverGoogleResources,
  selectGoogleResources,
} from "@/lib/google-reporting/data"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; connectionId: string }> },
) {
  try {
    const { id, connectionId } = await params
    const session = await reportingAccess(request, id)
    return noStoreJson({
      resources: await discoverGoogleResources(
        id,
        connectionId,
        session.user.id,
      ),
    })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; connectionId: string }> },
) {
  try {
    const { id, connectionId } = await params
    const session = await reportingAccess(request, id, true)
    const body = await jsonBody(
      request,
      z
        .object({
          externalIds: z
            .array(z.string().min(1).max(2048))
            .max(100)
            .refine((v) => new Set(v).size === v.length),
          version: z.iso.datetime(),
        })
        .strict(),
    )
    await selectGoogleResources(
      id,
      connectionId,
      body.externalIds,
      body.version,
      session.user.id,
    )
    return noStoreJson({ success: true })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
