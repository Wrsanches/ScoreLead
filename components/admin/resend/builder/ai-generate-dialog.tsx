"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { EmailComponentSet, EmailDocument } from "@/lib/resend/blocks"
import { readJson, resendErrorMessage } from "@/components/admin/resend/errors"
import { AiMark } from "@/components/admin/resend/ai-mark"

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

export type AiDraft = { name: string; subject: string; previewText: string; angle: string; doc: EmailDocument; previewHtml: string }
type Tone = "professional" | "friendly" | "casual" | "direct"
const TONES: Tone[] = ["professional", "friendly", "casual", "direct"]

/**
 * Drafts three complete emails from the business profile. The user picks one
 * (optionally adopting the proposed shared components) and keeps editing.
 */
export function AiGenerateDialog({
  businessId,
  open,
  onOpenChange,
  hasContent,
  languageLabel,
  onApply,
}: {
  businessId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  hasContent: boolean
  languageLabel: string
  onApply: (draft: AiDraft, components: EmailComponentSet | null) => void
}) {
  const t = useTranslations("resend")
  const [goal, setGoal] = useState("")
  const [tone, setTone] = useState<Tone>("professional")
  const [step, setStep] = useState<"form" | "generating" | "results">("form")
  const [drafts, setDrafts] = useState<AiDraft[]>([])
  const [components, setComponents] = useState<EmailComponentSet | null>(null)
  const [adoptComponents, setAdoptComponents] = useState(true)
  const [pending, setPending] = useState<AiDraft | null>(null)

  async function generate() {
    setStep("generating")
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/templates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() || undefined, tone, proposeComponents: true }),
      })
      const body = await readJson<{ drafts?: AiDraft[]; components?: EmailComponentSet | null; error?: string; code?: string }>(response)
      if (!response.ok || !body?.drafts?.length) {
        toast.error(resendErrorMessage(t, body, "aiFailed"))
        setStep("form")
        return
      }
      setDrafts(body.drafts)
      setComponents(body.components ?? null)
      setStep("results")
    } catch {
      toast.error(t("aiFailed"))
      setStep("form")
    }
  }

  function choose(draft: AiDraft) {
    if (hasContent) setPending(draft)
    else apply(draft)
  }
  function apply(draft: AiDraft) {
    onApply(draft, adoptComponents ? components : null)
    setPending(null)
    onOpenChange(false)
    setStep("form")
    toast.success(t("aiApplied"))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => step !== "generating" && onOpenChange(next)}>
        <DialogContent className="max-w-5xl! rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-0 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-white/[0.08]">
            <DialogTitle className="flex items-center gap-2">
              <AiMark size={16} active={step === "generating"} />
              {t("aiTitle")}
            </DialogTitle>
            <DialogDescription>{t("aiDescription", { language: languageLabel })}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-6 py-5">
            {step === "form" && (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="space-y-2">
                  <Label htmlFor="ai-goal" className="text-xs uppercase tracking-wider text-zinc-500">{t("aiGoal")}</Label>
                  <Textarea id="ai-goal" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={600} rows={3} placeholder={t("aiGoalPlaceholder")} className={INPUT} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("aiTone")}</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                    <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((value) => (
                        <SelectItem key={value} value={value}>{t(`aiTone${value[0].toUpperCase()}${value.slice(1)}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === "generating" && (
              <div className="grid gap-4 md:grid-cols-3" aria-live="polite" aria-busy="true">
                <p className="sr-only">{t("aiGenerating")}</p>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-3 rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ))}
                <p className="flex items-center gap-2 text-sm text-zinc-500 md:col-span-3">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("aiGenerating")}
                </p>
              </div>
            )}

            {step === "results" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {drafts.map((draft, i) => (
                    <div key={i} className="flex flex-col rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                      <Badge variant="outline" className="w-fit text-[11px]">{draft.angle}</Badge>
                      <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{draft.subject}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{draft.previewText}</p>
                      <iframe title={draft.subject} sandbox="" srcDoc={draft.previewHtml} className="mt-3 h-80 w-full rounded-xl border border-white/[0.08] bg-white" />
                      <Button type="button" className="mt-3" onClick={() => choose(draft)}>{t("aiUseThis")}</Button>
                    </div>
                  ))}
                </div>
                {components && (
                  <label className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <Checkbox checked={adoptComponents} onCheckedChange={(v) => setAdoptComponents(v === true)} className="mt-0.5" />
                    <span>{t("aiComponentsOffer")}</span>
                  </label>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-zinc-200 px-6 py-4 dark:border-white/[0.08]">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={step === "generating"}>{t("cancel")}</Button>
            {step === "form" && (
              <Button type="button" onClick={generate}>
                <AiMark size={16} />
                {t("aiGenerate")}
              </Button>
            )}
            {step === "results" && (
              <Button type="button" variant="outline" onClick={generate}>
                <RefreshCw className="size-4" />
                {t("aiRegenerate")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("aiReplaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("aiReplaceBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pending && apply(pending)}>{t("aiUseThis")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
