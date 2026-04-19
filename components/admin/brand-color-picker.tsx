"use client"

import { useTranslations } from "next-intl"
import { Check, Palette, Star, Sparkles, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BrandColorPickerProps {
  colors: string[]
  primary: string | null
  secondary: string | null
  onPrimaryChange: (color: string | null) => void
  onSecondaryChange: (color: string | null) => void
}

function normalize(value: string | null) {
  return value ? value.toLowerCase() : null
}

function Slot({
  label,
  value,
  emptyLabel,
  icon: Icon,
  accent,
  onClear,
}: {
  label: string
  value: string | null
  emptyLabel: string
  icon: typeof Star
  accent: "emerald" | "sky"
  onClear: () => void
}) {
  const ring =
    accent === "emerald"
      ? "ring-emerald-500/30 bg-emerald-500/5"
      : "ring-sky-500/30 bg-sky-500/5"
  const iconColor = accent === "emerald" ? "text-emerald-400" : "text-sky-400"
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border border-zinc-800/70 ring-1 ${ring}`}
    >
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-lg border border-zinc-800 shadow-inner"
          style={{
            backgroundColor: value || "transparent",
            backgroundImage: value
              ? undefined
              : "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 12px)",
          }}
        />
        <div
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-2.5 h-2.5" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] uppercase tracking-wider font-semibold ${iconColor}`}>
          {label}
        </p>
        {value ? (
          <p className="text-sm text-zinc-200 font-mono tabular-nums uppercase truncate">
            {value}
          </p>
        ) : (
          <p className="text-sm text-zinc-600 italic">{emptyLabel}</p>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          aria-label="Clear"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function BrandColorPicker({
  colors,
  primary,
  secondary,
  onPrimaryChange,
  onSecondaryChange,
}: BrandColorPickerProps) {
  const t = useTranslations("business")
  const primaryNorm = normalize(primary)
  const secondaryNorm = normalize(secondary)

  if (colors.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Slot
          label={t("primaryColor")}
          value={primary}
          emptyLabel={t("noColorAssigned")}
          icon={Star}
          accent="emerald"
          onClear={() => onPrimaryChange(null)}
        />
        <Slot
          label={t("secondaryColor")}
          value={secondary}
          emptyLabel={t("noColorAssigned")}
          icon={Sparkles}
          accent="sky"
          onClear={() => onSecondaryChange(null)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {colors.map((color) => {
          const norm = color.toLowerCase()
          const isPrimary = primaryNorm === norm
          const isSecondary = secondaryNorm === norm
          const ringClass = isPrimary
            ? "ring-2 ring-emerald-500/60"
            : isSecondary
              ? "ring-2 ring-sky-500/60"
              : "ring-1 ring-transparent hover:ring-zinc-700"
          return (
            <DropdownMenu key={color}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`group flex items-center gap-2.5 p-2 pr-2.5 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-150 text-left ${ringClass}`}
                >
                  <div
                    className="w-9 h-9 rounded-lg border border-zinc-800 shrink-0 shadow-inner relative"
                    style={{ backgroundColor: color }}
                  >
                    {(isPrimary || isSecondary) && (
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-zinc-950 ${
                          isPrimary ? "bg-emerald-400" : "bg-sky-400"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-200 font-mono tabular-nums uppercase truncate">
                      {color}
                    </p>
                    <p
                      className={`text-[10px] font-medium ${
                        isPrimary
                          ? "text-emerald-400"
                          : isSecondary
                            ? "text-sky-400"
                            : "text-zinc-600 group-hover:text-zinc-500"
                      }`}
                    >
                      {isPrimary
                        ? t("primaryColor")
                        : isSecondary
                          ? t("secondaryColor")
                          : "Tap to assign"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    if (secondaryNorm === norm) onSecondaryChange(null)
                    onPrimaryChange(color)
                  }}
                  disabled={isPrimary}
                >
                  <Star className="w-3.5 h-3.5 text-emerald-400" />
                  {t("setAsPrimary")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (primaryNorm === norm) onPrimaryChange(null)
                    onSecondaryChange(color)
                  }}
                  disabled={isSecondary}
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  {t("setAsSecondary")}
                </DropdownMenuItem>
                {(isPrimary || isSecondary) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (isPrimary) onPrimaryChange(null)
                        if (isSecondary) onSecondaryChange(null)
                      }}
                    >
                      <X className="w-3.5 h-3.5 text-zinc-500" />
                      {t("clearAssignment")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}
      </div>
    </div>
  )
}

export function BrandColorPickerEmpty() {
  const t = useTranslations("business")
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600">
      <Palette className="w-3.5 h-3.5" />
      {t("noBrand")}
    </div>
  )
}
