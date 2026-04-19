"use client"

import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle, Loader2, ArrowLeft, Upload, ImageIcon, Check } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { getTranslatedCategories } from "@/lib/categories"
import { ChevronDown } from "lucide-react"
import { useLocale } from "next-intl"
import { BrandColorPicker } from "@/components/admin/brand-color-picker"
import { TagsInput } from "@/components/admin/tags-input"

function createReviewSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("errorNameRequired")),
    description: z.string().min(1, t("errorDescriptionRequired")),
    persona: z.string().min(1, t("errorPersonaRequired")),
    clientPersona: z.string().min(1, t("errorClientPersonaRequired")),
    field: z.string().min(1, t("errorFieldRequired")),
    category: z.string().min(1, t("errorCategoryRequired")),
    tags: z.string().min(1, t("errorTagsRequired")),
    location: z.string(),
  })
}

export type ReviewValues = z.infer<ReturnType<typeof createReviewSchema>>

interface StepReviewProps {
  defaultValues?: Partial<ReviewValues>
  logo?: string | null
  onLogoChange?: (logo: string | null) => void
  brandColors?: string[]
  primaryColor?: string | null
  secondaryColor?: string | null
  onPrimaryColorChange?: (color: string | null) => void
  onSecondaryColorChange?: (color: string | null) => void
  onSubmit: (data: ReviewValues) => void
  onBack?: () => void
  isSubmitting: boolean
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const

const inputClasses =
  "w-full px-4 py-3 bg-zinc-800/20 border border-zinc-800/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-200"

export function StepReview({
  defaultValues,
  logo,
  onLogoChange,
  brandColors = [],
  primaryColor = null,
  secondaryColor = null,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onSubmit,
  onBack,
  isSubmitting,
}: StepReviewProps) {
  const t = useTranslations("onboarding")
  const tBusiness = useTranslations("business")
  const locale = useLocale()
  const categories = getTranslatedCategories(locale)
  const reviewSchema = createReviewSchema(t)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return // 2MB max
    const reader = new FileReader()
    reader.onload = () => {
      onLogoChange?.(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const businessName = defaultValues?.name || ""
  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: "",
      description: "",
      persona: "",
      clientPersona: "",
      field: "",
      category: "",
      tags: "",
      location: "",
      ...defaultValues,
    },
  })

  const groups = [
    {
      label: "Identity",
      fields: [
        { name: "name" as const, label: t("reviewName"), type: "input" as const, placeholder: t("reviewNamePlaceholder") },
        { name: "field" as const, label: t("reviewField"), type: "input" as const, placeholder: t("reviewFieldPlaceholder") },
        { name: "category" as const, label: t("reviewCategory"), type: "select" as const, placeholder: t("reviewCategoryPlaceholder") },
      ],
    },
    {
      label: "Story",
      fields: [
        { name: "description" as const, label: t("reviewDescription"), type: "textarea" as const, placeholder: t("reviewDescriptionPlaceholder") },
        { name: "persona" as const, label: t("reviewPersona"), type: "textarea" as const, placeholder: t("reviewPersonaPlaceholder") },
        { name: "clientPersona" as const, label: t("reviewClientPersona"), type: "textarea" as const, placeholder: t("reviewClientPersonaPlaceholder") },
      ],
    },
    {
      label: "Discovery",
      fields: [
        { name: "tags" as const, label: t("reviewTags"), type: "tags" as const, placeholder: t("reviewTagsPlaceholder") },
        { name: "location" as const, label: t("reviewLocation"), type: "input" as const, placeholder: t("reviewLocationPlaceholder") },
      ],
    },
  ]

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-8">
        {/* Logo */}
        <div className="relative group mb-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : initials ? (
              <span className="text-2xl font-bold text-emerald-400/80">{initials}</span>
            ) : (
              <ImageIcon className="w-8 h-8 text-zinc-600" />
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        </div>

        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {t("reviewTitle")}
        </h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-sm">{t("reviewDescription2")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {brandColors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3 font-medium">
              {tBusiness("brandColors")}
            </label>
            <BrandColorPicker
              colors={brandColors}
              primary={primaryColor}
              secondary={secondaryColor}
              onPrimaryChange={(c) => onPrimaryColorChange?.(c)}
              onSecondaryChange={(c) => onSecondaryColorChange?.(c)}
            />
            <div className="h-px bg-zinc-800/60 my-6" />
          </motion.div>
        )}

        {groups.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: groupIndex * 0.1, ease: EASE }}
          >
            {groupIndex > 0 && <div className="h-px bg-zinc-800/60 my-6" />}
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium"
                  >
                    {field.label}
                  </label>

                  {field.type === "textarea" ? (
                    <>
                      <div className="relative">
                        <textarea
                          {...register(field.name)}
                          id={field.name}
                          placeholder={field.placeholder}
                          rows={6}
                          className={`${inputClasses} resize-none pr-10`}
                        />
                        {watch(field.name)?.trim() && !errors[field.name] && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute right-3 top-3 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                          </motion.div>
                        )}
                      </div>
                      {errors[field.name] && (
                        <p className="text-red-400 text-xs mt-1.5">{errors[field.name]?.message}</p>
                      )}
                    </>
                  ) : field.type === "select" ? (
                    <>
                      <div className="relative">
                        <select
                          {...register(field.name)}
                          id={field.name}
                          className={`${inputClasses} pr-10 appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-zinc-900 text-zinc-500">
                            {field.placeholder}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value} className="bg-zinc-900 text-white">
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        {watch(field.name)?.trim() && !errors[field.name] ? (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center pointer-events-none"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                          </motion.div>
                        ) : (
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        )}
                      </div>
                      {errors[field.name] && (
                        <p className="text-red-400 text-xs mt-1.5">{errors[field.name]?.message}</p>
                      )}
                    </>
                  ) : field.type === "tags" ? (
                    <>
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: f }) => (
                          <TagsInput
                            value={f.value}
                            onChange={f.onChange}
                            placeholder={field.placeholder}
                          />
                        )}
                      />
                      {errors[field.name] && (
                        <p className="text-red-400 text-xs mt-1.5">{errors[field.name]?.message}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          {...register(field.name)}
                          id={field.name}
                          type="text"
                          placeholder={field.placeholder}
                          className={`${inputClasses} pr-10`}
                        />
                        {watch(field.name)?.trim() && !errors[field.name] && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                          </motion.div>
                        )}
                      </div>
                      {errors[field.name] && (
                        <p className="text-red-400 text-xs mt-1.5">{errors[field.name]?.message}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 pt-8"
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm text-zinc-500 hover:text-zinc-300 font-medium rounded-xl transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("back")}
            </button>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={isSubmitting ? {} : { scale: 1.01 }}
            whileTap={isSubmitting ? {} : { scale: 0.99 }}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {t("completeSetup")}
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  )
}
