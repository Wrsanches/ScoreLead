"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ContentWrapper, PageHeader } from "@/components/admin"
import { SettingsNav, type SettingsSectionId } from "./_components/settings-nav"
import { ProfileSection } from "./_components/profile-section"
import { PreferencesSection } from "./_components/preferences-section"
import { SecuritySection } from "./_components/security-section"
import { BillingSection } from "./_components/billing-section"
import { NotificationsSection } from "./_components/notifications-section"
import { DangerZoneSection } from "./_components/danger-zone-section"

export default function SettingsPage() {
  const t = useTranslations("settings")
  const [section, setSection] = useState<SettingsSectionId>("profile")

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("title")}
          description={t("description")}
          breadcrumbs={[{ label: t("title") }]}
        />

        <div className="flex flex-col md:flex-row gap-8">
          <SettingsNav active={section} onChange={setSection} />
          <div className="flex-1 min-w-0">
            {section === "profile" && <ProfileSection />}
            {section === "preferences" && <PreferencesSection />}
            {section === "security" && <SecuritySection />}
            {section === "billing" && <BillingSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "danger" && <DangerZoneSection />}
          </div>
        </div>
      </ContentWrapper>
    </div>
  )
}
