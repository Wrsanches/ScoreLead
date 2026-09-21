"use client"

import { useTranslations } from "next-intl"
import { Eye, EyeOff, Lock, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EmailComponentKind, ResolvedEmailComponents } from "@/lib/resend/blocks"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import { HeaderComponent } from "@/lib/emails/blocks/shared/header"
import { FooterComponent } from "@/lib/emails/blocks/shared/footer"

/** Header or footer inside the canvas: shared, locked, toggleable. */
export function SharedBlock({
  kind,
  enabled,
  customized,
  components,
  theme,
  readOnly,
  onToggle,
  onEdit,
}: {
  kind: EmailComponentKind
  enabled: boolean
  customized: boolean
  components: ResolvedEmailComponents
  theme: BrandTheme
  readOnly: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
}) {
  const t = useTranslations("resend")
  const label = t(`shared${kind[0].toUpperCase()}${kind.slice(1)}`)
  const content =
    kind === "header" ? (
      <HeaderComponent props={components.header} theme={theme} />
    ) : (
      <FooterComponent props={components.footer} theme={theme} />
    )

  return (
    <div className={`group relative -mx-3 rounded-lg border border-dashed px-3 py-1 ${enabled ? "border-zinc-300/80 dark:border-zinc-600/80" : "border-zinc-200 dark:border-zinc-700"}`} onClick={(e) => e.stopPropagation()}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3" aria-hidden="true" />
          <span className="font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span>{customized ? t("sharedCustomized") : t("sharedDefaults")}</span>
        </span>
        {!readOnly && (
          <span className="inline-flex items-center gap-0.5">
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900" onClick={onEdit}>
              <Pencil className="size-3" />
              {t("edit")}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900" onClick={() => onToggle(!enabled)} aria-pressed={!enabled}>
              {enabled ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {enabled ? t("sharedHide") : t("sharedShow")}
            </Button>
          </span>
        )}
      </div>
      {enabled ? <div>{content}</div> : <p className="py-2 text-xs italic text-zinc-400">{t("sharedHidden", { kind: label })}</p>}
    </div>
  )
}
