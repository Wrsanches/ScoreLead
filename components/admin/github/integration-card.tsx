"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { IntegrationCard } from "@/components/admin/integrations/integration-card"
import type { PublicGitHubConnection } from "@/lib/github/contracts"
import { supportRequest } from "@/components/admin/support/request"

export function GitHubIntegrationCard({ businessId }: { businessId: string }) {
  const t = useTranslations("integrations")
  const tg = useTranslations("githubIntegration")
  const [data, setData] = useState<{ connection: PublicGitHubConnection | null; enabled: boolean } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    supportRequest<{ connection: PublicGitHubConnection | null; enabled: boolean }>(`/api/businesses/${businessId}/github/connection`, { signal: controller.signal })
      .then(setData).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [businessId])
  const status = failed || (data && !data.enabled) ? "unavailable" : !data ? "loading" : data.connection ? "connected" : "disconnected"
  return <IntegrationCard platform="github" brandColor="#18181b" name="GitHub" tagline={tg("tagline")} status={status}
    statusLabel={status === "connected" ? t("statusConnected") : status === "unavailable" ? t("statusUnavailable") : t("statusNotConnected")}
    detail={failed ? tg("loadError") : data?.connection?.repository} href="/admin/integrations/github"
    actionLabel={data?.connection ? t("actionManage") : t("actionConnect")} />
}
