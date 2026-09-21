"use client"

import { useTranslations } from "next-intl"
import { Braces } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EMAIL_TEMPLATE_VARIABLES, type EmailVariableKey } from "@/lib/resend/render"

/** Picker for template variables; the caller decides where the token goes. */
export function VariableMenu({
  onPick,
  label,
  disabled,
  size = "sm",
  iconOnly = false,
  onDark = false,
}: {
  onPick: (key: EmailVariableKey) => void
  label: string
  disabled?: boolean
  size?: "sm" | "default"
  iconOnly?: boolean
  /** Trigger styled for the dark toolbar pill over the white email canvas. */
  onDark?: boolean
}) {
  const t = useTranslations("resend")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={onDark ? "ghost" : "outline"} size={size} disabled={disabled} aria-label={label} title={label} className={onDark ? "size-7 px-0 text-zinc-300 hover:bg-white/[0.1] hover:text-white" : undefined}>
          <Braces className="size-3.5" />
          {!iconOnly && label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto border border-white/[0.08] bg-[#0c0c0e] text-zinc-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-none">
        <DropdownMenuLabel>{t("tplVariables")}</DropdownMenuLabel>
        {EMAIL_TEMPLATE_VARIABLES.map((key) => (
          <DropdownMenuItem key={key} onClick={() => onPick(key)} className="flex flex-col items-start gap-0.5 focus:bg-white/[0.06]">
            <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300">{`{{${key}}}`}</span>
            <span className="text-xs text-zinc-400">{t(`variables.${key}`)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
