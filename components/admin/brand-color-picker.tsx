"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Droplet, Droplets, Palette, Pipette, X } from "lucide-react"
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
  readOnly?: boolean
}

function normalize(value: string | null) {
  return value ? value.toLowerCase() : null
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/

/** Accepts "1e88e5", "#1E88E5" or "#fff"; returns a lowercase 6-digit hex or null. */
function parseHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "")
  if (!HEX_RE.test(`#${raw}`)) return null
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw
  return `#${full.toLowerCase()}`
}

function Slot({
  label,
  value,
  emptyLabel,
  icon: Icon,
  accent,
  onChange,
  readOnly,
}: {
  label: string
  value: string | null
  emptyLabel: string
  icon: typeof Droplet
  accent: "emerald" | "sky"
  onChange: (color: string | null) => void
  readOnly: boolean
}) {
  const t = useTranslations("business")
  const [draft, setDraft] = useState(value ?? "")
  const [invalid, setInvalid] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Keep the field in sync when the value changes from outside (chip click,
  // clear, optimistic rollback).
  useEffect(() => {
    setDraft(value ?? "")
    setInvalid(false)
  }, [value])

  function commit() {
    if (draft.trim() === "") {
      setInvalid(false)
      if (value) onChange(null)
      return
    }
    const parsed = parseHex(draft)
    if (!parsed) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setDraft(parsed)
    if (parsed !== normalize(value)) onChange(parsed)
  }

  const ring =
    accent === "emerald"
      ? "ring-emerald-500/30 bg-emerald-500/5"
      : "ring-sky-500/30 bg-sky-500/5"
  const iconColor = accent === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] ring-1 ${ring}`}
    >
      <div className="relative shrink-0">
        {/* The swatch doubles as the trigger for the native colour picker. */}
        <button
          type="button"
          disabled={readOnly}
          onClick={() => colorInputRef.current?.click()}
          title={t("pickAnyColor")}
          aria-label={t("pickAnyColor")}
          className={`group/swatch relative w-10 h-10 rounded-lg border border-zinc-200 dark:border-white/[0.08] shadow-inner overflow-hidden transition-transform ${
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-[1.04] active:scale-[0.98]"
          }`}
          style={{
            backgroundColor: value || "transparent",
            backgroundImage: value
              ? undefined
              : "repeating-linear-gradient(45deg, rgba(127,127,127,0.18) 0 6px, transparent 6px 12px)",
          }}
        >
          {!readOnly && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 group-hover/swatch:opacity-100 transition-opacity">
              <Pipette className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
        <input
          ref={colorInputRef}
          type="color"
          tabIndex={-1}
          aria-hidden="true"
          disabled={readOnly}
          value={parseHex(value ?? "") ?? "#808080"}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="sr-only"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold ${iconColor}`}>
          <Icon
            className="w-3 h-3"
            strokeWidth={2.5}
            fill={accent === "emerald" ? "currentColor" : "none"}
            aria-hidden="true"
          />
          {label}
        </p>
        {readOnly ? (
          value ? (
            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-mono tabular-nums uppercase truncate">
              {value}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-600 italic">{emptyLabel}</p>
          )
        ) : (
          <>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              placeholder={emptyLabel}
              maxLength={7}
              onChange={(e) => {
                setDraft(e.target.value)
                if (invalid) setInvalid(false)
              }}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commit()
                  e.currentTarget.blur()
                } else if (e.key === "Escape") {
                  setDraft(value ?? "")
                  setInvalid(false)
                  e.currentTarget.blur()
                }
              }}
              aria-label={`${label} ${t("hexColor")}`}
              aria-invalid={invalid || undefined}
              className={`w-full bg-transparent text-sm font-mono tabular-nums uppercase text-zinc-800 dark:text-zinc-200 placeholder:normal-case placeholder:italic placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:outline-none border-b border-transparent focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors ${
                invalid ? "text-red-600 dark:text-red-400 border-red-500/60" : ""
              }`}
            />
            {invalid && (
              <p className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">{t("invalidHex")}</p>
            )}
          </>
        )}
      </div>
      {value && !readOnly && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.11] transition-colors"
          aria-label={t("clearAssignment")}
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
  readOnly = false,
}: BrandColorPickerProps) {
  const t = useTranslations("business")
  const primaryNorm = normalize(primary)
  const secondaryNorm = normalize(secondary)

  // Website colours first, then any hand-picked colour that is not among
  // them, so a custom pick still shows up as a chip that can be reassigned.
  const palette: string[] = []
  const seen = new Set<string>()
  for (const c of [...colors, primary, secondary]) {
    const norm = normalize(c ?? null)
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    palette.push(c!)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Slot
          label={t("primaryColor")}
          value={primary}
          emptyLabel={t("noColorAssigned")}
          icon={Droplet}
          accent="emerald"
          onChange={onPrimaryChange}
          readOnly={readOnly}
        />
        <Slot
          label={t("secondaryColor")}
          value={secondary}
          emptyLabel={t("noColorAssigned")}
          icon={Droplets}
          accent="sky"
          onChange={onSecondaryChange}
          readOnly={readOnly}
        />
      </div>

      {!readOnly && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-600">{t("pickAnyColorHint")}</p>
      )}

      {palette.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {palette.map((color) => {
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
                  disabled={readOnly}
                  className={`group flex items-center gap-2.5 p-2 pr-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.22] hover:bg-zinc-100/60 dark:hover:bg-white/[0.06] transition-all duration-150 text-left ${ringClass}`}
                >
                  <div
                    className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-white/[0.08] shrink-0 shadow-inner relative"
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
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 font-mono tabular-nums uppercase truncate">
                      {color}
                    </p>
                    <p
                      className={`text-[10px] font-medium ${
                        isPrimary
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isSecondary
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-500"
                      }`}
                    >
                      {isPrimary
                        ? t("primaryColor")
                        : isSecondary
                          ? t("secondaryColor")
                          : t("tapToAssign")}
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
                  <Droplet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t("setAsPrimary")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (primaryNorm === norm) onPrimaryChange(null)
                    onSecondaryChange(color)
                  }}
                  disabled={isSecondary}
                >
                  <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
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
      )}
    </div>
  )
}

export function BrandColorPickerEmpty() {
  const t = useTranslations("business")
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-600">
      <Palette className="w-3.5 h-3.5" />
      {t("noBrand")}
    </div>
  )
}
