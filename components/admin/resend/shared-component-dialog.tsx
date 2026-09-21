"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { uploadImage, UploadError } from "@/lib/upload-client"
import {
  emailComponentPropsByKind,
  resolveComponents,
  substituteComponentProps,
  type EmailComponentKind,
  type EmailComponentSet,
  type FooterProps,
  type HeaderProps,
} from "@/lib/resend/blocks"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import type { EmailContext } from "@/lib/resend/render"
import { HeaderComponent } from "@/lib/emails/blocks/shared/header"
import { FooterComponent } from "@/lib/emails/blocks/shared/footer"
import { readJson, resendErrorMessage } from "./errors"
import { BrandFontLink } from "./brand-font-link"
import { AiMark } from "./ai-mark"

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

type AnyProps = HeaderProps | FooterProps

/**
 * Edit one business-wide component (header or footer). The form
 * on the left is mirrored live by the real React Email component on the
 * right, so what is saved is what every template will render.
 */
export function SharedComponentDialog({
  businessId,
  kind,
  open,
  onOpenChange,
  components,
  theme,
  logoFallback,
  previewContext,
  onSaved,
}: {
  businessId: string
  kind: EmailComponentKind
  open: boolean
  onOpenChange: (open: boolean) => void
  components: EmailComponentSet
  theme: BrandTheme
  logoFallback?: string | null
  previewContext?: EmailContext
  onSaved: (components: EmailComponentSet) => void
}) {
  const t = useTranslations("resend")
  const resolved = useMemo(() => resolveComponents(components), [components])
  const [draft, setDraft] = useState<AnyProps>(resolved[kind])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const current = resolved[kind]
    if (kind === "header" && !(current as HeaderProps).logoUrl && logoFallback && /^https:\/\//.test(logoFallback)) {
      setDraft({ ...(current as HeaderProps), logoUrl: logoFallback })
    } else {
      setDraft(current)
    }
    setError(null)
  }, [open, kind, resolved, logoFallback])

  const patch = <T extends AnyProps>(update: Partial<T>) => setDraft((d) => ({ ...(d as T), ...update }))

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const { url } = await uploadImage(file, { kind: "business-logo", maxBytes: 4 * 1024 * 1024 })
      patch<HeaderProps>({ logoUrl: url })
    } catch (e) {
      toast.error(e instanceof UploadError ? e.message : t("uploadFailed"))
    } finally {
      setUploading(false)
    }
  }

  async function suggest() {
    setSuggesting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/components/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kinds: [kind] }),
      })
      const body = await readJson<{ components?: EmailComponentSet; error?: string; code?: string }>(response)
      const proposed = body?.components?.[kind]
      if (!response.ok || !proposed) {
        toast.error(resendErrorMessage(t, body, "aiComponentsFailed"))
        return
      }
      // Keep an existing logo if the suggestion has none.
      if (kind === "header" && !(proposed as HeaderProps).logoUrl && (draft as HeaderProps).logoUrl) {
        setDraft({ ...(proposed as HeaderProps), logoUrl: (draft as HeaderProps).logoUrl })
      } else {
        setDraft(proposed as AnyProps)
      }
      toast.success(t("aiSuggested"))
    } catch {
      toast.error(t("aiComponentsFailed"))
    } finally {
      setSuggesting(false)
    }
  }

  async function save() {
    const parsed = emailComponentPropsByKind[kind].safeParse(draft)
    if (!parsed.success) {
      setError(t("sharedInvalid"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/components`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [kind]: parsed.data }),
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

  const preview = (() => {
    const shown = previewContext
      ? substituteComponentProps({ ...resolved, [kind]: draft } as typeof resolved, previewContext)[kind]
      : draft
    if (kind === "header") return <HeaderComponent props={shown as HeaderProps} theme={theme} />
    return <FooterComponent props={shown as FooterProps} theme={theme} />
  })()

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-w-4xl! rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-0 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-white/[0.08]">
          <DialogTitle>{t("sharedEdit", { kind: t(`shared${kind[0].toUpperCase()}${kind.slice(1)}`) })}</DialogTitle>
          <DialogDescription>{t("sharedLocked")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            {kind === "header" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("headerLogo")}</Label>
                  <div className="flex items-center gap-3">
                    {(draft as HeaderProps).logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(draft as HeaderProps).logoUrl ?? ""} alt="" className="size-11 rounded-lg border border-zinc-200 bg-white object-contain dark:border-white/[0.08]" />
                    ) : (
                      <span className="flex size-11 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 dark:border-white/[0.12]">
                        <Upload className="size-4" />
                      </span>
                    )}
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); e.target.value = "" }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      {t("uploadImage")}
                    </Button>
                    {(draft as HeaderProps).logoUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => patch<HeaderProps>({ logoUrl: null })}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <Field label={t("headerBusinessName")} value={(draft as HeaderProps).businessName} onChange={(v) => patch<HeaderProps>({ businessName: v })} maxLength={120} />
                <Field label={t("headerTagline")} value={(draft as HeaderProps).tagline} onChange={(v) => patch<HeaderProps>({ tagline: v })} maxLength={160} />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("fieldAlign")}</Label>
                  <ToggleGroup type="single" value={(draft as HeaderProps).align} onValueChange={(v) => v && patch<HeaderProps>({ align: v as "left" | "center" })} className="inline-flex rounded-lg border border-white/[0.1] bg-white/[0.04] p-0.5">
                    <ToggleGroupItem value="left" className="h-8 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white">{t("alignLeft")}</ToggleGroupItem>
                    <ToggleGroupItem value="center" className="h-8 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white">{t("alignCenter")}</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </>
            )}

            {kind === "footer" && (
              <>
                <Field label={t("footerBusinessName")} value={(draft as FooterProps).businessName} onChange={(v) => patch<FooterProps>({ businessName: v })} maxLength={120} />
                <Field label={t("footerLocation")} value={(draft as FooterProps).locationText} onChange={(v) => patch<FooterProps>({ locationText: v })} maxLength={200} />
                <Field label={t("footerWebsite")} value={(draft as FooterProps).website ?? ""} onChange={(v) => patch<FooterProps>({ website: v.trim() || null })} placeholder="https://" />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("footerSocial")}</Label>
                  {(draft as FooterProps).socialLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={link.label} placeholder="Instagram" className={INPUT} maxLength={40} onChange={(e) => { const links = [...(draft as FooterProps).socialLinks]; links[i] = { ...links[i], label: e.target.value }; patch<FooterProps>({ socialLinks: links }) }} />
                      <Input value={link.href} placeholder="https://" className={INPUT} onChange={(e) => { const links = [...(draft as FooterProps).socialLinks]; links[i] = { ...links[i], href: e.target.value.trim() }; patch<FooterProps>({ socialLinks: links }) }} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => patch<FooterProps>({ socialLinks: (draft as FooterProps).socialLinks.filter((_, j) => j !== i) })} aria-label={t("delete")}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  {(draft as FooterProps).socialLinks.length < 4 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => patch<FooterProps>({ socialLinks: [...(draft as FooterProps).socialLinks, { label: "", href: "" }] })}>
                      <Plus className="size-3.5" />
                      {t("footerSocialAdd")}
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("footerNote")}</Label>
                  <Textarea value={(draft as FooterProps).note} maxLength={300} rows={2} className={INPUT} onChange={(e) => patch<FooterProps>({ note: e.target.value })} />
                </div>
                <Field label={t("footerUnsubscribeLabel")} value={(draft as FooterProps).unsubscribeLabel} onChange={(v) => patch<FooterProps>({ unsubscribeLabel: v })} maxLength={60} hint={t("footerUnsubscribeNote")} />
              </>
            )}

            <p className="text-xs leading-5 text-zinc-500">{t("sharedVariablesHint")}</p>
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div className="self-start rounded-2xl border border-white/[0.08] bg-black/30 p-4">
            <BrandFontLink theme={theme} />
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("tplPreview")}</p>
            <div className="rounded-xl p-5" style={{ backgroundColor: theme.background }}>
              <div className="mx-auto max-w-[520px] rounded-xl bg-white px-8 py-6 text-[#18181b]" style={{ fontFamily: theme.fontStack, border: `1px solid ${theme.accentSoft}`, borderTop: `4px solid ${theme.primary}` }}>
                {preview}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-zinc-200 px-6 py-4 dark:border-white/[0.08] sm:justify-between">
          <Button type="button" variant="outline" onClick={suggest} disabled={saving || suggesting || uploading} className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
            {suggesting ? <Loader2 className="size-4 animate-spin" /> : <AiMark size={16} />}
            {t("aiSuggest")}
          </Button>
          <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("cancel")}</Button>
          <Button type="button" onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("sharedSave")}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value, onChange, maxLength, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number; placeholder?: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-zinc-500">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} className={INPUT} />
      {hint && <p className="text-xs leading-5 text-zinc-500">{hint}</p>}
    </div>
  )
}
