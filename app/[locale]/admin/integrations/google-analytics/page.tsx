import ReportingSettings from "@/components/admin/google-reporting/reporting-settings"

export const metadata = { title: "Google Analytics 4" }

export default function Page() {
  return <ReportingSettings integration="ga4" />
}
