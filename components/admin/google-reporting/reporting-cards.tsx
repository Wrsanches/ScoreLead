"use client"

import { useTranslations } from "next-intl"
import {
  IntegrationCard,
  type IntegrationStatus,
} from "@/components/admin/integrations/integration-card"
import { reportingIntegrationPath } from "@/lib/google-reporting/paths"
import { ReportingIcon } from "./reporting-icon"
import { useReporting } from "./use-reporting"

export function ReportingCards({ businessId }: { businessId: string }) {
  const t = useTranslations("googleReporting")
  const ti = useTranslations("integrations")
  const { data, error, loading } = useReporting(businessId)
  return (
    <>
      {(["ga4", "search_console", "assistants"] as const).map((integration) => {
        const assistants = integration === "assistants"
        const connections =
          data?.connections.filter((c) => c.provider === integration) ?? []
        const count = assistants
          ? (data?.grants.length ?? 0)
          : connections.reduce((sum, c) => sum + c.resources.length, 0)
        const status: IntegrationStatus = loading
          ? "loading"
          : error
            ? "unavailable"
            : connections.some((c) => c.status === "reconnect")
              ? "reconnect"
              : (assistants ? count : connections.length)
                ? "connected"
                : "disconnected"
        const label = error
          ? t("loadErrorShort")
          : status === "reconnect"
            ? ti("statusReconnect")
            : status === "connected"
              ? ti("statusConnected")
              : ti("statusNotConnected")
        return (
          <IntegrationCard
            key={integration}
            icon={
              <ReportingIcon integration={integration} className="size-11" />
            }
            brandColor={
              assistants
                ? "#10b981"
                : integration === "ga4"
                  ? "#f59e0b"
                  : "#0ea5e9"
            }
            name={
              assistants
                ? t("assistantName")
                : integration === "ga4"
                  ? "Google Analytics 4"
                  : "Google Search Console"
            }
            tagline={t(
              assistants
                ? "assistantsTagline"
                : integration === "ga4"
                  ? "gaTagline"
                  : "searchTagline",
            )}
            status={status}
            statusLabel={label}
            detail={
              (assistants ? count > 0 : connections.length > 0)
                ? t(assistants ? "assistantCount" : "selectedCount", { count })
                : null
            }
            href={reportingIntegrationPath(integration)}
            actionLabel={
              assistants
                ? t("setup")
                : connections.length
                  ? ti("actionManage")
                  : ti("actionConnect")
            }
          />
        )
      })}
    </>
  )
}
