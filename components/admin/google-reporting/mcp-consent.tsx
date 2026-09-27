"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reportingFetch } from "./use-reporting"
import { Link } from "@/i18n/routing"
export function McpConsent({
  requestId,
  clientName,
  redirectOrigin,
  businesses,
}: {
  requestId: string
  clientName: string
  redirectOrigin: string
  businesses: {
    id: string
    name: string
    resources: { id: string; name: string; provider: string }[]
  }[]
}) {
  const t = useTranslations("googleReporting")
  const [businessId, setBusinessId] = useState(businesses[0]?.id || "")
  const selectedBusiness = businesses.find((b) => b.id === businessId)
  const [selected, setSelected] = useState(
    businesses[0]?.resources.map((r) => r.id) || [],
  )
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  async function decide(accept: boolean) {
    setBusy(true)
    setError("")
    try {
      const result = await reportingFetch<{ url: string }>(
        "/api/mcp/oauth/consent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            accept,
            businessId,
            resourceIds: selected,
          }),
        },
      )
      window.location.assign(result.url)
    } catch (cause) {
      const code =
        cause instanceof Error ? cause.message : "REPORTING_UNAVAILABLE"
      setError(
        t.has(`errors.${code}`)
          ? t(`errors.${code}`)
          : t("errors.REPORTING_UNAVAILABLE"),
      )
      setBusy(false)
    }
  }
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-12"
    >
      <div className="glass-card w-full rounded-2xl p-6 sm:p-8">
        <Bot className="mb-5 size-9 text-emerald-400" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">{t("consentTitle")}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-zinc-300">
          {t("consentDescription", { name: clientName })}
        </p>
        <p className="mt-2 break-all text-xs text-zinc-500">
          {t("clientDestination", { origin: redirectOrigin })}
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          {t("consentLimits")}
        </p>
        {businesses.length === 0 ? (
          <div className="my-6 space-y-3">
            <p className="text-sm text-amber-300">{t("consentEmpty")}</p>
            <Link
              className="text-sm text-emerald-400 underline"
              href="/admin/integrations"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openIntegrations")}
            </Link>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              {t("retry")}
            </Button>
          </div>
        ) : (
          <fieldset disabled={busy} className="my-6 space-y-4">
            <div>
              <label
                htmlFor="mcp-business"
                className="mb-2 block text-sm font-medium"
              >
                {t("business")}
              </label>
              <select
                id="mcp-business"
                name="business"
                value={businessId}
                onChange={(event) => {
                  setBusinessId(event.target.value)
                  setSelected(
                    businesses
                      .find((b) => b.id === event.target.value)
                      ?.resources.map((r) => r.id) || [],
                  )
                }}
                className="w-full rounded-lg border border-white/15 bg-zinc-900 p-3 text-base focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                {t("consentProperties")}
              </legend>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {selectedBusiness?.resources.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-start gap-3 rounded-lg border border-white/10 p-3"
                  >
                    <input
                      type="checkbox"
                      name="resources"
                      value={r.id}
                      className="mt-1 size-4 shrink-0 accent-emerald-500"
                      checked={selected.includes(r.id)}
                      onChange={(event) =>
                        setSelected((ids) =>
                          event.target.checked
                            ? [...ids, r.id]
                            : ids.filter((id) => id !== r.id),
                        )
                      }
                    />
                    <span className="min-w-0 text-sm">
                      <span className="block break-words">{r.name}</span>
                      <span className="text-xs text-zinc-500">
                        {r.provider === "ga4"
                          ? "Google Analytics 4"
                          : "Google Search Console"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </fieldset>
        )}
        {error && (
          <p role="alert" className="mb-4 text-sm text-amber-300">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => decide(false)}
            disabled={busy}
          >
            {t("deny")}
          </Button>
          <Button
            onClick={() => decide(true)}
            disabled={busy || !selected.length || selected.length > 100}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("authorize")}
          </Button>
        </div>
      </div>
    </main>
  )
}
