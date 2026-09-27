import ReportingSettings from "@/components/admin/google-reporting/reporting-settings"

export const metadata = { title: "Google Search Console" }

export default function Page() {
  return <ReportingSettings integration="search_console" />
}
