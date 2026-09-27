export type ReportingIntegration = "ga4" | "search_console" | "assistants"

const segments: Record<ReportingIntegration, string> = {
  ga4: "google-analytics",
  search_console: "search-console",
  assistants: "ai-assistants",
}

export function reportingIntegrationPath(
  integration: ReportingIntegration,
  businessId?: string,
) {
  const base = businessId ? `/admin/business/${businessId}` : "/admin"
  return `${base}/integrations/${segments[integration]}`
}
