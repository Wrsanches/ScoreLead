"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Pencil, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VariableMenu } from "@/components/admin/resend/variable-menu"
import { uploadImage, UploadError } from "@/lib/upload-client"
import { EMAIL_COMPONENT_KINDS, isValidHref, type EmailAlign, type EmailBlock, type EmailComponentKind, type EmailComponentSet, type EmailDocument } from "@/lib/resend/blocks"
import { AiMark } from "@/components/admin/resend/ai-mark"
import type { ProductImage } from "@/lib/product-images"
import { ImageGenerateDialog } from "./image-generate-dialog"

const INPUT =
  "w-full px-3 py-2 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

function AlignField({ value, onChange, label }: { value: EmailAlign; onChange: (v: EmailAlign) => void; label: string }) {
  const t = useTranslations("resend")
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</Label>
      <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as EmailAlign)} className="inline-flex rounded-lg border border-white/[0.1] bg-white/[0.04] p-0.5">
        <ToggleGroupItem value="left" className="h-7 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white">{t("alignLeft")}</ToggleGroupItem>
        <ToggleGroupItem value="center" className="h-7 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white">{t("alignCenter")}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

/**
 * Settings for the selected block, or document-level settings when nothing
 * is selected (preview text and which shared components this email uses).
 */
export function BlockInspector({
  businessId,
  logo = null,
  productImages = [],
  doc,
  block,
  components,
  readOnly,
  onUpdateBlock,
  onDocChange,
  onEditShared,
  onGenerateShared,
}: {
  businessId: string
  logo?: string | null
  productImages?: ProductImage[]
  doc: EmailDocument
  block: EmailBlock | null
  components: EmailComponentSet
  readOnly: boolean
  onUpdateBlock: (block: EmailBlock) => void
  onDocChange: (patch: Partial<Pick<EmailDocument, "previewText" | "shared">>) => void
  onEditShared: (kind: EmailComponentKind) => void
  onGenerateShared?: () => void
}) {
  const t = useTranslations("resend")
  const [uploading, setUploading] = useState(false)
  const [imageAiOpen, setImageAiOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!block || block.type !== "image") return
    setUploading(true)
    try {
      const { url } = await uploadImage(file, { kind: "email-asset", maxBytes: 4 * 1024 * 1024 })
      onUpdateBlock({ ...block, props: { ...block.props, src: url } })
    } catch (e) {
      toast.error(e instanceof UploadError ? e.message : t("uploadFailed"))
    } finally {
      setUploading(false)
    }
  }

  if (!block) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="tpl-preview-text" className="text-[11px] uppercase tracking-wider text-zinc-500">{t("previewTextLabel")}</Label>
          <Input id="tpl-preview-text" value={doc.previewText} maxLength={150} className={INPUT} disabled={readOnly} onChange={(e) => onDocChange({ previewText: e.target.value })} />
          <p className="text-xs leading-5 text-zinc-500">{t("previewTextHint")}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">{t("sharedTitle")}</p>
            {onGenerateShared && !readOnly && (
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-emerald-700 dark:text-emerald-300" onClick={onGenerateShared}>
                <AiMark size={12} />
                {t("aiComponentsButton")}
              </Button>
            )}
          </div>
          {EMAIL_COMPONENT_KINDS.map((kind) => {
            const label = t(`shared${kind[0].toUpperCase()}${kind.slice(1)}`)
            return (
              <div key={kind} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-white/[0.08]">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{label}</p>
                  <p className="text-[11px] text-zinc-500">{components[kind] ? t("sharedCustomized") : t("sharedDefaults")}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!readOnly && (
                    <Button type="button" variant="ghost" size="sm" className="size-7 px-0" onClick={() => onEditShared(kind)} aria-label={t("sharedEdit", { kind: label })}>
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                  <Switch checked={doc.shared[kind]} disabled={readOnly} onCheckedChange={(v) => onDocChange({ shared: { ...doc.shared, [kind]: v } })} aria-label={label} />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs leading-5 text-zinc-500">{t("inspectorNoSelection")}</p>
      </div>
    )
  }

  const update = <B extends EmailBlock>(props: Partial<B["props"]>) => onUpdateBlock({ ...block, props: { ...block.props, ...props } } as EmailBlock)

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldLevel")}</Label>
            <ToggleGroup type="single" value={String(block.props.level)} onValueChange={(v) => v && update({ level: Number(v) as 1 | 2 })} className="inline-flex rounded-lg border border-white/[0.1] bg-white/[0.04] p-0.5">
              <ToggleGroupItem value="1" className="h-7 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white">H1</ToggleGroupItem>
              <ToggleGroupItem value="2" className="h-7 rounded-md px-3 text-xs text-zinc-400 data-[state=on]:bg-white/[0.12] data-[state=on]:text-white">H2</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <AlignField value={block.props.align} onChange={(align) => update({ align })} label={t("fieldAlign")} />
        </div>
      )
    case "text":
      return <AlignField value={block.props.align} onChange={(align) => update({ align })} label={t("fieldAlign")} />
    case "button": {
      const hrefOk = !block.props.href || isValidHref(block.props.href)
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldLabel")}</Label>
            <Input value={block.props.label} maxLength={80} className={INPUT} disabled={readOnly} onChange={(e) => update({ label: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldUrl")}</Label>
              <VariableMenu iconOnly size="sm" label={t("tplInsertVariable")} disabled={readOnly} onPick={(key) => update({ href: `{{${key}}}` })} />
            </div>
            <Input value={block.props.href} className={`${INPUT} ${hrefOk ? "" : "border-red-500/60"}`} placeholder="https://" disabled={readOnly} onChange={(e) => update({ href: e.target.value.trim() })} />
            <p className="text-xs leading-5 text-zinc-500">{t("fieldUrlHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldVariant")}</Label>
            <Select value={block.props.variant} onValueChange={(v) => update({ variant: v as "primary" | "secondary" })} disabled={readOnly}>
              <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">{t("variantPrimary")}</SelectItem>
                <SelectItem value="secondary">{t("variantSecondary")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlignField value={block.props.align} onChange={(align) => update({ align })} label={t("fieldAlign")} />
        </div>
      )
    }
    case "image": {
      const library: { id: string; url: string; label: string }[] = [
        ...(logo ? [{ id: "logo", url: logo, label: t("imageAiRefLogo") }] : []),
        ...productImages.filter((img) => img.url).map((img, i) => ({ id: img.id, url: img.url, label: img.description || t("imageAiRefProduct", { n: i + 1 }) })),
      ]
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldImage")}</Label>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = "" }} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={readOnly || uploading}>
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {uploading ? t("uploading") : t("uploadImage")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setImageAiOpen(true)} disabled={readOnly || uploading} className="gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200">
                <AiMark size={14} />
                {t("imageAiButton")}
              </Button>
            </div>
          </div>
          {library.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("imageLibrary")}</Label>
              <div className="flex flex-wrap gap-2">
                {library.map((item) => {
                  const active = block.props.src === item.url
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={readOnly}
                      title={item.label}
                      aria-label={item.label}
                      aria-pressed={active}
                      onClick={() => update({ src: item.url, alt: block.props.alt || (item.id === "logo" ? "" : item.label) })}
                      className={`h-14 w-14 overflow-hidden rounded-lg border bg-white ${active ? "border-white/60 ring-2 ring-white/40" : "border-white/[0.1] hover:border-white/30"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.label} className="h-full w-full object-contain p-1" />
                    </button>
                  )
                })}
              </div>
              <p className="text-xs leading-5 text-zinc-500">{t("imageLibraryHint")}</p>
            </div>
          )}
          <ImageGenerateDialog
            businessId={businessId}
            open={imageAiOpen}
            onOpenChange={setImageAiOpen}
            logo={logo}
            productImages={productImages}
            onUse={(image) => update({ src: image.url, alt: block.props.alt || image.alt })}
          />
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldImageUrl")}</Label>
            <Input value={block.props.src} className={INPUT} placeholder="https://" disabled={readOnly} onChange={(e) => update({ src: e.target.value.trim() })} />
            <p className="text-xs leading-5 text-zinc-500">{t("imageHttpsHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldAlt")}</Label>
            <Input value={block.props.alt} maxLength={200} className={INPUT} disabled={readOnly} onChange={(e) => update({ alt: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldImageLink")}</Label>
            <Input value={block.props.href ?? ""} className={INPUT} placeholder="https://" disabled={readOnly} onChange={(e) => update({ href: e.target.value.trim() || null })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldWidth")}: {block.props.width ? `${block.props.width}px` : "100%"}</Label>
            <Slider min={80} max={600} step={10} value={[block.props.width ?? 600]} disabled={readOnly} onValueChange={([v]) => update({ width: v >= 600 ? null : v })} />
          </div>
          <AlignField value={block.props.align} onChange={(align) => update({ align })} label={t("fieldAlign")} />
        </div>
      )
    }
    case "spacer":
      return (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-zinc-500">{t("fieldHeight")}: {block.props.height}px</Label>
          <Slider min={8} max={96} step={4} value={[block.props.height]} disabled={readOnly} onValueChange={([v]) => update({ height: v })} />
        </div>
      )
    case "divider":
      return <p className="text-xs leading-5 text-zinc-500">{t("inspectorNothingToEdit")}</p>
  }
}
