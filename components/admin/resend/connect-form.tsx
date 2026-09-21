"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PublicResendConnection } from "@/lib/resend/data"
import type { ResendDomainSummary, ResendKeyScope } from "@/lib/resend/client"
import { RESEND_API_KEY_RE, RESEND_TEST_DOMAIN } from "@/lib/resend/template-form"
import { readJson, resendErrorMessage } from "./errors"

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

type Verified = { scope: ResendKeyScope; domains: ResendDomainSummary[] }

/**
 * Two-step connect: paste and verify the API key, then choose the sender.
 * With a full-access key the From domain comes from the account's verified
 * domains; a sending-only key falls back to a free-text address.
 */
export function ResendConnectForm({
  businessId,
  onConnected,
}: {
  businessId: string
  onConnected: (connection: PublicResendConnection) => void
}) {
  const t = useTranslations("resend")
  const [apiKey, setApiKey] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<Verified | null>(null)
  const [domainId, setDomainId] = useState<string>("")
  const [localPart, setLocalPart] = useState("hello")
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [replyTo, setReplyTo] = useState("")
  const [connecting, setConnecting] = useState(false)

  const usableDomains = verified?.domains.filter((d) => d.sending) ?? []
  const selectedDomain = usableDomains.find((d) => d.id === domainId) ?? null
  const keyLooksValid = RESEND_API_KEY_RE.test(apiKey.trim())

  async function verify() {
    setVerifying(true)
    setVerified(null)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/connection/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const body = await readJson<Verified & { error?: string; code?: string }>(response)
      if (!response.ok || !body) {
        toast.error(resendErrorMessage(t, body, "errors.INVALID_API_KEY"))
        return
      }
      setVerified({ scope: body.scope, domains: body.domains })
      const first = body.domains.find((d) => d.sending)
      setDomainId(first?.id ?? (body.scope === "full" ? RESEND_TEST_DOMAIN : ""))
      toast.success(t("keyVerified"))
    } catch {
      toast.error(t("connectError"))
    } finally {
      setVerifying(false)
    }
  }

  const resolvedFrom =
    verified?.scope === "full"
      ? domainId === RESEND_TEST_DOMAIN
        ? `onboarding@${RESEND_TEST_DOMAIN}`
        : selectedDomain
          ? `${localPart.trim()}@${selectedDomain.name}`
          : ""
      : fromEmail.trim()

  async function connect() {
    if (!verified) return
    setConnecting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          fromName: fromName.trim(),
          fromEmail: resolvedFrom.toLowerCase(),
          replyTo: replyTo.trim() || undefined,
          domainId: selectedDomain?.id,
        }),
      })
      const body = await readJson<{ connection?: PublicResendConnection; error?: string; code?: string }>(response)
      if (!response.ok || !body?.connection) {
        toast.error(resendErrorMessage(t, body, "connectError"))
        return
      }
      toast.success(t("connectedToast"))
      onConnected(body.connection)
    } catch {
      toast.error(t("connectError"))
    } finally {
      setConnecting(false)
    }
  }

  const canConnect =
    !!verified &&
    fromName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedFrom) &&
    (!replyTo.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo.trim()))

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="resend-api-key" className="text-xs uppercase tracking-wider text-zinc-500">
          {t("apiKey")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="resend-api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setVerified(null)
            }}
            placeholder="re_••••••••••••••••"
            className={INPUT}
            disabled={verifying || connecting}
          />
          <Button onClick={verify} disabled={!keyLooksValid || verifying || connecting} className="shrink-0">
            {verifying ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {verifying ? t("verifying") : t("verifyKey")}
          </Button>
        </div>
        <p className="text-xs leading-5 text-zinc-500">{t("apiKeyHelp")}</p>
      </div>

      {verified && (
        <div className="space-y-5 border-t border-zinc-200 pt-5 dark:border-white/[0.08]">
          <div className="flex items-start gap-2 text-sm">
            {verified.scope === "full" ? (
              <>
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-zinc-700 dark:text-zinc-300">
                  {t("keyVerifiedDomains", { count: usableDomains.length })}
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{t("keySendingOnly")}</p>
                  <p className="mt-0.5 text-xs leading-5 text-zinc-500">{t("keySendingOnlyHelp")}</p>
                </div>
              </>
            )}
          </div>

          {verified.scope === "full" ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("fromLocalPart")}</Label>
                <Input
                  value={domainId === RESEND_TEST_DOMAIN ? "onboarding" : localPart}
                  onChange={(e) => setLocalPart(e.target.value.replace(/[^A-Za-z0-9._+-]/g, ""))}
                  disabled={domainId === RESEND_TEST_DOMAIN || connecting}
                  className={INPUT}
                  placeholder="hello"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("domain")}</Label>
                <Select value={domainId} onValueChange={setDomainId} disabled={connecting}>
                  <SelectTrigger className={INPUT}>
                    <SelectValue placeholder={t("domain")} />
                  </SelectTrigger>
                  <SelectContent>
                    {usableDomains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        @{d.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={RESEND_TEST_DOMAIN}>@{RESEND_TEST_DOMAIN} ({t("testDomain")})</SelectItem>
                  </SelectContent>
                </Select>
                {usableDomains.length === 0 && (
                  <p className="text-xs leading-5 text-amber-700 dark:text-amber-400">{t("noVerifiedDomains")}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="resend-from" className="text-xs uppercase tracking-wider text-zinc-500">
                {t("fromEmail")}
              </Label>
              <Input
                id="resend-from"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="hello@yourdomain.com"
                className={INPUT}
                disabled={connecting}
              />
              <p className="text-xs leading-5 text-zinc-500">{t("fromEmailHelp")}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resend-from-name" className="text-xs uppercase tracking-wider text-zinc-500">
                {t("fromName")}
              </Label>
              <Input
                id="resend-from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder={t("fromNamePlaceholder")}
                className={INPUT}
                disabled={connecting}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resend-reply-to" className="text-xs uppercase tracking-wider text-zinc-500">
                {t("replyTo")}
              </Label>
              <Input
                id="resend-reply-to"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder={t("optional")}
                className={INPUT}
                disabled={connecting}
              />
            </div>
          </div>

          {resolvedFrom && (
            <p className="text-xs text-zinc-500">
              {t("willSendAs")}{" "}
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {fromName.trim() || "…"} &lt;{resolvedFrom}&gt;
              </span>
            </p>
          )}

          <Button onClick={connect} disabled={!canConnect || connecting}>
            {connecting && <Loader2 className="size-4 animate-spin" />}
            {connecting ? t("connecting") : t("connectButton")}
          </Button>
        </div>
      )}
    </div>
  )
}
