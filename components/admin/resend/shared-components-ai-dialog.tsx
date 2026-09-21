"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { resolveComponents, substituteComponentProps, type EmailComponentSet } from "@/lib/resend/blocks"
import type { EmailContext } from "@/lib/resend/render"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import { HeaderComponent } from "@/lib/emails/blocks/shared/header"
import { FooterComponent } from "@/lib/emails/blocks/shared/footer"
import { readJson, resendErrorMessage } from "./errors"
import { BrandFontLink } from "./brand-font-link"
import { AiMark } from "./ai-mark"

/**
 * One click drafts header and footer from the business profile,
 * shows them rendered, and saves all three on approval.
 */
export function SharedComponentsAiDialog({
  businessId,
  open,
  onOpenChange,
  theme,
  previewContext,
  onSaved,
}: {
  businessId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: BrandTheme
  previewContext?: EmailContext
  onSaved: (components: EmailComponentSet) => void
}) {
  const t = useTranslations("resend")
  const [proposal, setProposal] = useState<EmailComponentSet | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function generate() {
    setGenerating(true)
    setProposal(null)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/components/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const body = await readJson<{ components?: EmailComponentSet; error?: string; code?: string }>(response)
      if (!response.ok || !body?.components) {
        toast.error(resendErrorMessage(t, body, "aiComponentsFailed"))
        onOpenChange(false)
        return
      }
      setProposal(body.components)
    } catch {
      toast.error(t("aiComponentsFailed"))
      onOpenChange(false)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (open) void generate()
    // Runs once per open; regenerate is an explicit button.
  }, [open])

  async function apply() {
    if (!proposal) return
    setSaving(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/components`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header: proposal.header ?? undefined, footer: proposal.footer ?? undefined }),
      })
      const body = await readJson<{ components?: EmailComponentSet; error?: string; code?: string }>(response)
      if (!response.ok || !body?.components) {
        toast.error(resendErrorMessage(t, body, "sharedSaveFailed"))
        return
      }
      toast.success(t("sharedSaved"))
      onSaved(body.components)
      onOpenChange(false)
    } catch {
      toast.error(t("sharedSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const resolved = proposal ? (previewContext ? substituteComponentProps(resolveComponents(proposal), previewContext) : resolveComponents(proposal)) : null

  return (
    <Dialog open={open} onOpenChange={(next) => !generating && !saving && onOpenChange(next)}>
      <DialogContent className="max-w-3xl! rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-0 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-white/[0.08]">
          <DialogTitle className="flex items-center gap-2">
            <AiMark size={16} active={generating} />
            {t("aiComponentsTitle")}
          </DialogTitle>
          <DialogDescription>{t("aiComponentsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {generating || !resolved ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("aiComponentsGenerating")}
              </p>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
              <BrandFontLink theme={theme} />
              <div className="rounded-xl p-5" style={{ backgroundColor: theme.background }}>
              <div className="mx-auto max-w-[520px] rounded-xl bg-white px-8 py-6 text-[#18181b]" style={{ fontFamily: theme.fontStack, border: `1px solid ${theme.accentSoft}`, borderTop: `4px solid ${theme.primary}` }}>
                {proposal?.header && <HeaderComponent props={resolved.header} theme={theme} />}
                <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.7, color: "#a1a1aa", fontStyle: "italic" }}>{t("aiComponentsBodyPlaceholder")}</p>
                {proposal?.footer && <FooterComponent props={resolved.footer} theme={theme} />}
              </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-zinc-200 px-6 py-4 dark:border-white/[0.08]">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={generating || saving}>{t("cancel")}</Button>
          <Button type="button" variant="outline" onClick={generate} disabled={generating || saving}>
            <RefreshCw className="size-4" />
            {t("aiRegenerate")}
          </Button>
          <Button type="button" onClick={apply} disabled={generating || saving || !proposal}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("aiComponentsApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
