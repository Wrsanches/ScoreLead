"use client"
import type { ReactNode } from "react"
import { ReportingNavigationProvider } from "@/components/admin/google-reporting/reporting-navigation"
// Integration and support forms share the established unsaved-changes owner.
export {
  useReportingNavigation as useIntegrationNavigation,
} from "@/components/admin/google-reporting/reporting-navigation"

export function IntegrationNavigationProvider({ children }: { children: ReactNode }) {
  return <ReportingNavigationProvider messageNamespace="integrationNavigation">{children}</ReportingNavigationProvider>
}
