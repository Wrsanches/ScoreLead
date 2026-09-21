"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ContentWrapper, PageHeader } from "@/components/admin"
import {
  IntegrationCard,
  type IntegrationStatus,
} from "@/components/admin/integrations/integration-card"
import { useInstagramConnection } from "@/components/admin/instagram-connection-card"
import { useBusinessAccess } from "@/components/admin/business-context"
import { authClient } from "@/lib/auth-client"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"

const WHATSAPP_INTEGRATION_CONFIGURED =
  process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED === "true"

type WhatsAppSummary = {
  status: "connected" | "needs_action" | "disconnected"
  verifiedName: string | null
  displayPhoneNumber: string | null
} | null

export default function IntegrationsPage() {
  const t = useTranslations("integrations")
  const td = useTranslations("dashboard")
  const { businessId, readOnly } = useBusinessAccess()
  const { data: session } = authClient.useSession()

  const instagram = useInstagramConnection(businessId)

  const whatsappEnabled =
    WHATSAPP_INTEGRATION_CONFIGURED &&
    (readOnly || hasWhatsAppEarlyAccess(session?.user.email))
  const [whatsapp, setWhatsapp] = useState<{ loaded: boolean; connection: WhatsAppSummary }>({
    loaded: false,
    connection: null,
  })

  useEffect(() => {
    if (!whatsappEnabled) return
    const controller = new AbortController()
    fetch(`/api/businesses/${businessId}/whatsapp/connection`, { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : { connection: null }))
      .then((body) => setWhatsapp({ loaded: true, connection: body.connection ?? null }))
      .catch(() => {
        if (!controller.signal.aborted) setWhatsapp({ loaded: true, connection: null })
      })
    return () => controller.abort()
  }, [businessId, whatsappEnabled])

  // Instagram card state
  let instagramStatus: IntegrationStatus = "loading"
  if (instagram.loadError) instagramStatus = "disconnected"
  else if (instagram.data) {
    if (!instagram.data.enabled && !instagram.data.connection) instagramStatus = "unavailable"
    else if (instagram.connected) instagramStatus = "connected"
    else if (instagram.data.connection) instagramStatus = "reconnect"
    else instagramStatus = "disconnected"
  }

  // WhatsApp card state
  let whatsappStatus: IntegrationStatus = "loading"
  if (!whatsappEnabled) whatsappStatus = "coming_soon"
  else if (whatsapp.loaded) {
    if (whatsapp.connection?.status === "connected") whatsappStatus = "connected"
    else if (whatsapp.connection) whatsappStatus = "reconnect"
    else whatsappStatus = "disconnected"
  }

  const statusLabel = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return t("statusConnected")
      case "reconnect":
        return t("statusReconnect")
      case "coming_soon":
        return t("statusComingSoon")
      case "unavailable":
        return t("statusUnavailable")
      default:
        return t("statusNotConnected")
    }
  }

  const actionLabel = (status: IntegrationStatus) => {
    if (status === "connected" || status === "reconnect") return t("actionManage")
    if (status === "coming_soon" || status === "unavailable") return t("actionLearnMore")
    return t("actionConnect")
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("title")}
          description={t("description")}
          breadcrumbs={[
            { label: td("businessPage"), href: "/admin/profile" },
            { label: t("title") },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <IntegrationCard
            platform="instagram"
            name="Instagram"
            tagline={t("instagramTagline")}
            status={instagramStatus}
            statusLabel={statusLabel(instagramStatus)}
            detail={
              instagram.data?.connection
                ? t("connectedAs", { username: instagram.data.connection.username })
                : null
            }
            href="/admin/integrations/instagram"
            actionLabel={actionLabel(instagramStatus)}
          />
          <IntegrationCard
            platform="whatsapp"
            name="WhatsApp"
            tagline={t("whatsappTagline")}
            status={whatsappStatus}
            statusLabel={statusLabel(whatsappStatus)}
            detail={
              whatsapp.connection?.status === "connected"
                ? whatsapp.connection.verifiedName || whatsapp.connection.displayPhoneNumber
                : null
            }
            href="/admin/integrations/whatsapp"
            actionLabel={actionLabel(whatsappStatus)}
          />
        </div>
      </ContentWrapper>
    </div>
  )
}
