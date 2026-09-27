import { getTranslations } from "next-intl/server"
import ReportingSettings from "@/components/admin/google-reporting/reporting-settings"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "googleReporting" })
  return { title: t("assistantName") }
}

export default function Page() {
  return <ReportingSettings integration="assistants" />
}
