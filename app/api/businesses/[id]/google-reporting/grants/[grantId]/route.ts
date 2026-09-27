import { reportingAccess, noStoreJson } from "@/lib/google-reporting/http"
import { reportingErrorResponse } from "@/lib/google-reporting/errors"
import { revokeMcpGrant } from "@/lib/mcp/oauth"
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; grantId: string }> },
) {
  try {
    const { id, grantId } = await params
    const session = await reportingAccess(request, id, true)
    await revokeMcpGrant(session.user.id, id, grantId)
    return noStoreJson({ success: true })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
