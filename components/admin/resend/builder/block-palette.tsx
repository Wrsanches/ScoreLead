"use client"

import { useTranslations } from "next-intl"
import { Heading1, Image as ImageIcon, Minus, MoveVertical, RectangleHorizontal, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EMAIL_BLOCK_KINDS, type EmailBlockKind } from "@/lib/resend/blocks"
import { AiMark } from "@/components/admin/resend/ai-mark"

const ICONS: Record<EmailBlockKind, typeof Type> = {
  heading: Heading1,
  text: Type,
  button: RectangleHorizontal,
  image: ImageIcon,
  divider: Minus,
  spacer: MoveVertical,
}

export function BlockPalette({
  onAdd,
  onGenerate,
  disabled,
}: {
  onAdd: (kind: EmailBlockKind) => void
  onGenerate?: () => void
  disabled?: boolean
}) {
  const t = useTranslations("resend")
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100/70 p-1.5 dark:border-white/[0.08] dark:bg-white/[0.05]">
      {EMAIL_BLOCK_KINDS.map((kind) => {
        const Icon = ICONS[kind]
        return (
          <Button key={kind} type="button" variant="ghost" size="sm" onClick={() => onAdd(kind)} disabled={disabled} className="gap-1.5">
            <Icon className="size-3.5" aria-hidden="true" />
            {t(`palette${kind[0].toUpperCase()}${kind.slice(1)}`)}
          </Button>
        )
      })}
      {onGenerate && (
        <>
          <span className="mx-1 h-5 w-px bg-zinc-300 dark:bg-white/[0.12]" aria-hidden="true" />
          <Button type="button" variant="outline" size="sm" onClick={onGenerate} disabled={disabled} className="gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
            <AiMark size={14} />
            {t("aiButton")}
          </Button>
        </>
      )}
    </div>
  )
}
