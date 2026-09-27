import { reportingAccess, noStoreJson } from "@/lib/google-reporting/http"
import { reportingErrorResponse } from "@/lib/google-reporting/errors"
import { disconnectGoogle } from "@/lib/google-reporting/data"
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; connectionId: string }> },
) {
  try {
    const { id, connectionId } = await params
    await reportingAccess(request, id, true)
    await disconnectGoogle(id, connectionId)
    return noStoreJson({ success: true })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
