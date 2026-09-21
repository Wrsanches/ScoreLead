"use client"

import { useTranslations } from "next-intl"
import { ContentWrapper, PageHeader } from "@/components/admin"
import { SupportSection } from "./_components/support-section"

export default function SupportPage() {
  const t = useTranslations("settings")
  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("support")}
          description={t("supportDescription")}
          breadcrumbs={[{ label: t("support") }]}
        />
        <SupportSection />
      </ContentWrapper>
    </div>
  )
}
