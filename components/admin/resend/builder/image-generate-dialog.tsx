"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Check, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePlan } from "@/components/admin/plan-context"
import { AiMark } from "@/components/admin/resend/ai-mark"
import { readJson, resendErrorMessage } from "@/components/admin/resend/errors"
import type { ProductImage } from "@/lib/product-images"
import { MAX_REFERENCES, type EmailImageFormat } from "@/lib/services/email-image-generator"

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

const FORMATS: EmailImageFormat[] = ["wide", "square", "portrait"]
const TOGGLE = "h-7 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white"

export type GeneratedEmailImage = { url: string; alt: string }

/**
 * One GPT Image render for an image block: a subject line, a format, and an
 * up to four real product photos and/or the logo as references. Costs one
 * AI-image credit; the plan dialog opens when the cap is hit.
 */
export function ImageGenerateDialog({
  businessId,
  open,
  onOpenChange,
  logo,
  productImages,
  onUse,
}: {
  businessId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  logo: string | null
  productImages: ProductImage[]
  onUse: (image: GeneratedEmailImage) => void
}) {
  const t = useTranslations("resend")
  const { openUpgrade } = usePlan()
  const [prompt, setPrompt] = useState("")
  const [format, setFormat] = useState<EmailImageFormat>("wide")
  const [references, setReferences] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedEmailImage | null>(null)

  useEffect(() => {
    if (open) setResult(null)
  }, [open])

  const referenceOptions: { id: string; url: string; label: string }[] = [
    ...(logo ? [{ id: "logo", url: logo, label: t("imageAiRefLogo") }] : []),
    ...productImages.filter((img) => img.url).map((img, i) => ({ id: img.id, url: img.url, label: img.description || t("imageAiRefProduct", { n: i + 1 }) })),
  ]

  const generate = async () => {
    if (prompt.trim().length < 3) return
    setGenerating(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), format, references }),
      })
      const body = await readJson<{ url?: string; alt?: string; error?: string; code?: string; action?: string }>(response)
      if (!response.ok || !body?.url) {
        if (response.status === 402) openUpgrade(body?.action ?? "aiImage")
        toast.error(resendErrorMessage(t, body, "imageAiFailed"))
        return
      }
      setResult({ url: body.url, alt: body.alt ?? prompt.trim() })
    } catch {
      toast.error(t("imageAiFailed"))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !generating && onOpenChange(next)}>
      <DialogContent className="max-w-2xl! rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-0 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <DialogHeader className="border-b border-white/[0.08] px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <AiMark size={16} active={generating} />
            {t("imageAiTitle")}
          </DialogTitle>
          <DialogDescription>{t("imageAiDescription")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(100vh-14rem)] space-y-5 overflow-y-auto px-6 py-5">
          {result ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt={result.alt} className="w-full rounded-xl border border-white/[0.08] bg-white" />
              <p className="text-xs text-zinc-500">{t("imageAiResultHint")}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="img-ai-prompt" className="text-xs uppercase tracking-wider text-zinc-500">{t("imageAiPrompt")}</Label>
                <Textarea id="img-ai-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={600} rows={3} placeholder={t("imageAiPromptPlaceholder")} className={INPUT} disabled={generating} autoFocus />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("imageAiFormat")}</Label>
                <ToggleGroup type="single" value={format} onValueChange={(v) => v && setFormat(v as EmailImageFormat)} className="inline-flex rounded-lg border border-white/[0.1] bg-white/[0.04] p-0.5" disabled={generating}>
                  {FORMATS.map((f) => (
                    <ToggleGroupItem key={f} value={f} className={TOGGLE}>{t(`imageAiFormat${f[0].toUpperCase()}${f.slice(1)}`)}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              {referenceOptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("imageAiReference")}</Label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setReferences([])} disabled={generating} aria-pressed={references.length === 0} className={`flex h-16 w-16 items-center justify-center rounded-lg border text-[11px] ${references.length === 0 ? "border-white/60 bg-white/[0.08] text-white" : "border-white/[0.1] text-zinc-400 hover:border-white/30"}`}>
                      {t("imageAiRefNone")}
                    </button>
                    {referenceOptions.map((ref) => {
                      const index = references.indexOf(ref.id)
                      const selected = index >= 0
                      const full = !selected && references.length >= MAX_REFERENCES
                      return (
                        <button
                          key={ref.id}
                          type="button"
                          onClick={() => setReferences((prev) => (prev.includes(ref.id) ? prev.filter((id) => id !== ref.id) : prev.length >= MAX_REFERENCES ? prev : [...prev, ref.id]))}
                          disabled={generating || full}
                          title={ref.label}
                          aria-label={ref.label}
                          aria-pressed={selected}
                          className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-white ${selected ? "border-white/60 ring-2 ring-white/40" : "border-white/[0.1] hover:border-white/30"} ${full ? "opacity-40" : ""}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ref.url} alt={ref.label} className="h-full w-full object-contain p-1" />
                          {selected && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">{index + 1}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs leading-5 text-zinc-500">{t("imageAiReferenceHint", { max: MAX_REFERENCES })}</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-white/[0.08] px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>{t("cancel")}</Button>
          {result ? (
            <>
              <Button type="button" variant="outline" onClick={() => setResult(null)} className="gap-1.5">
                <RefreshCw className="size-4" />
                {t("imageAiTryAgain")}
              </Button>
              <Button type="button" onClick={() => { onUse(result); onOpenChange(false) }} className="gap-1.5">
                <Check className="size-4" />
                {t("imageAiUse")}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={generate} disabled={generating || prompt.trim().length < 3} className="gap-1.5">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <AiMark size={16} />}
              {generating ? t("imageAiGenerating") : t("imageAiGenerate")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
