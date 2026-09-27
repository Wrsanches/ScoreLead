import { reportingAccess, noStoreJson } from "@/lib/google-reporting/http"
import { reportingErrorResponse } from "@/lib/google-reporting/errors"
import { googleReportingAvailableTo } from "@/lib/google-reporting/config"
import { reportingConnections } from "@/lib/google-reporting/data"
import { listMcpGrants } from "@/lib/mcp/oauth"
import { mcpResource } from "@/lib/mcp/config"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await reportingAccess(request, id)
    const [connections, grants] = await Promise.all([
      reportingConnections(id),
      listMcpGrants(session.user.id, id),
    ])
    return noStoreJson({
      enabled: googleReportingAvailableTo(session.user),
      connections,
      grants,
      mcpUrl: mcpResource(),
    })
  } catch (error) {
    return reportingErrorResponse(error)
  }
}
