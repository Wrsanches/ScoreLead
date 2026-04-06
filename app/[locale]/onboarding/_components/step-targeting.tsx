"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, X, Plus, CornerDownLeft, Globe } from "lucide-react"

const EASE = [0.25, 0.46, 0.45, 0.94] as const

const inputClasses =
  "w-full px-4 py-3 bg-zinc-800/20 border border-zinc-800/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-200"

export interface TargetingValues {
  businessModel: "b2b" | "b2c" | "both"
  services: string[]
  serviceArea: "local" | "regional" | "national" | "international"
  competitors: string[]
}

interface StepTargetingProps {
  defaultValues?: Partial<TargetingValues>
  onSubmit: (data: TargetingValues) => void
  onBack: () => void
}

function RadioOption({
  value,
  label,
  description,
  selected,
  onSelect,
}: {
  value: string
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
        selected
          ? "border-emerald-500/30 bg-emerald-500/[0.08]"
          : "border-zinc-800/80 bg-zinc-800/20 hover:border-zinc-700/80"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            selected ? "border-emerald-500" : "border-zinc-600"
          }`}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${selected ? "text-white" : "text-zinc-300"}`}>
            {label}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  )
}

function ChipInput({
  values,
  onChange,
  placeholder,
  max = 10,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  max?: number
}) {
  const [inputValue, setInputValue] = useState("")

  const addItem = useCallback(
    (item: string) => {
      const trimmed = item.trim()
      if (!trimmed || values.includes(trimmed) || values.length >= max) return
      onChange([...values, trimmed])
      setInputValue("")
    },
    [values, onChange, max],
  )

  const removeItem = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index))
    },
    [values, onChange],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addItem(inputValue)
    }
    if (e.key === "Backspace" && !inputValue && values.length > 0) {
      removeItem(values.length - 1)
    }
  }

  return (
    <div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <AnimatePresence>
            {values.map((item, i) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-emerald-400/60 hover:text-emerald-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
      {values.length < max && (
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addItem(inputValue)}
            placeholder={values.length === 0 ? placeholder : "Add more..."}
            className={`${inputClasses} pr-20`}
          />
          <button
            type="button"
            onClick={() => addItem(inputValue)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              inputValue.trim()
                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-zinc-800/40 text-zinc-600"
            }`}
          >
            <CornerDownLeft className="w-3 h-3" />
            Enter
          </button>
        </div>
      )}
    </div>
  )
}

function CompetitorInputs({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  function updateAt(index: number, value: string) {
    const next = [...values]
    next[index] = value
    onChange(next)
  }

  function addSlot() {
    if (values.length < 5) {
      onChange([...values, ""])
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {values.map((val, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1 group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors duration-200 group-focus-within:text-emerald-400" />
              <input
                type="url"
                value={val}
                onChange={(e) => updateAt(i, e.target.value)}
                placeholder={`https://${placeholder.toLowerCase()}${i + 1}.com`}
                className={`${inputClasses} pl-11`}
              />
            </div>
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {values.length < 5 && (
        <button
          type="button"
          onClick={addSlot}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors mt-1"
        >
          <Plus className="w-3 h-3" />
          Add competitor
        </button>
      )}
    </div>
  )
}

export function StepTargeting({ defaultValues, onSubmit, onBack }: StepTargetingProps) {
  const t = useTranslations("onboarding")

  const [businessModel, setBusinessModel] = useState<TargetingValues["businessModel"]>(
    defaultValues?.businessModel || "b2c",
  )
  const [services, setServices] = useState<string[]>(defaultValues?.services || [])
  const [serviceArea, setServiceArea] = useState<TargetingValues["serviceArea"]>(
    defaultValues?.serviceArea || "local",
  )
  const [competitors, setCompetitors] = useState<string[]>(
    defaultValues?.competitors?.length ? defaultValues.competitors : [""],
  )

  function handleSubmit() {
    onSubmit({
      businessModel,
      services,
      serviceArea,
      competitors: competitors.filter((c) => c.trim()),
    })
  }

  const businessModelOptions = [
    { value: "b2b" as const, label: t("targetB2B"), description: t("targetB2BDesc") },
    { value: "b2c" as const, label: t("targetB2C"), description: t("targetB2CDesc") },
    { value: "both" as const, label: t("targetBoth"), description: t("targetBothDesc") },
  ]

  const serviceAreaOptions = [
    { value: "local" as const, label: t("areaLocal"), description: t("areaLocalDesc") },
    { value: "regional" as const, label: t("areaRegional"), description: t("areaRegionalDesc") },
    { value: "national" as const, label: t("areaNational"), description: t("areaNationalDesc") },
    { value: "international" as const, label: t("areaInternational"), description: t("areaInternationalDesc") },
  ]

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-10">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {t("targetingTitle")}
        </h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-sm leading-relaxed">
          {t("targetingDescription")}
        </p>
      </div>

      <div className="space-y-8">
        {/* Business Model */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: EASE }}
        >
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3 font-medium">
            {t("targetModelLabel")}
          </label>
          <div className="space-y-2">
            {businessModelOptions.map((opt) => (
              <RadioOption
                key={opt.value}
                value={opt.value}
                label={opt.label}
                description={opt.description}
                selected={businessModel === opt.value}
                onSelect={() => setBusinessModel(opt.value)}
              />
            ))}
          </div>
        </motion.div>

        <div className="h-px bg-zinc-800/60" />

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: EASE }}
        >
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
            {t("targetServicesLabel")}
          </label>
          <p className="text-xs text-zinc-600 mb-3">{t("targetServicesHint")}</p>
          <ChipInput
            values={services}
            onChange={setServices}
            placeholder={t("targetServicesPlaceholder")}
            max={10}
          />
        </motion.div>

        <div className="h-px bg-zinc-800/60" />

        {/* Service Area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3, ease: EASE }}
        >
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3 font-medium">
            {t("targetAreaLabel")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {serviceAreaOptions.map((opt) => (
              <RadioOption
                key={opt.value}
                value={opt.value}
                label={opt.label}
                description={opt.description}
                selected={serviceArea === opt.value}
                onSelect={() => setServiceArea(opt.value)}
              />
            ))}
          </div>
        </motion.div>

        <div className="h-px bg-zinc-800/60" />

        {/* Competitors */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4, ease: EASE }}
        >
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
            {t("targetCompetitorsLabel")}
          </label>
          <p className="text-xs text-zinc-600 mb-3">{t("targetCompetitorsHint")}</p>
          <CompetitorInputs
            values={competitors}
            onChange={setCompetitors}
            placeholder={t("targetCompetitorPlaceholder")}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 pt-8"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-5 py-3 text-sm text-zinc-500 hover:text-zinc-300 font-medium rounded-xl transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("back")}
        </button>

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={services.length === 0}
          whileHover={services.length > 0 ? { scale: 1.01 } : {}}
          whileTap={services.length > 0 ? { scale: 0.99 } : {}}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
        >
          {t("continue")}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  )
}
