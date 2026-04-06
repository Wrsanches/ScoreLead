"use client"

import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Users, Briefcase, Link2, ArrowRight, ArrowLeft, SkipForward, Check } from "lucide-react"
import { motion } from "framer-motion"

function createSchema(t: (key: string) => string) {
  return z.object({
    facebook: z.string().url(t("errorValidURL")).or(z.literal("")),
    linkedin: z.string().url(t("errorValidURL")).or(z.literal("")),
    other: z.string().url(t("errorValidURL")).or(z.literal("")),
  })
}

export type MoreLinksValues = z.infer<ReturnType<typeof createSchema>>

interface StepMoreLinksProps {
  defaultValues?: MoreLinksValues
  onSubmit: (data: MoreLinksValues) => void
  onBack: () => void
  onSkip: () => void
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const

export function StepMoreLinks({ defaultValues, onSubmit, onBack, onSkip }: StepMoreLinksProps) {
  const t = useTranslations("onboarding")
  const schema = createSchema(t)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MoreLinksValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      facebook: defaultValues?.facebook || "",
      linkedin: defaultValues?.linkedin || "",
      other: defaultValues?.other || "",
    },
  })

  const fields = [
    {
      name: "facebook" as const,
      icon: Users,
      label: t("facebook"),
      placeholder: t("facebookPlaceholder"),
    },
    {
      name: "linkedin" as const,
      icon: Briefcase,
      label: t("linkedin"),
      placeholder: t("linkedinPlaceholder"),
    },
    {
      name: "other" as const,
      icon: Link2,
      label: t("moreLinksOther"),
      placeholder: t("moreLinksOtherPlaceholder"),
    },
  ]

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-10">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {t("moreLinksTitle")}
        </h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-sm leading-relaxed">
          {t("moreLinksDescription")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {fields.map(({ name, icon: Icon, placeholder, label }, index) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.1, ease: EASE }}
          >
            <label
              htmlFor={name}
              className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium"
            >
              {label}
            </label>
            <div className="relative group">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors duration-200 group-focus-within:text-emerald-400" />
              <input
                {...register(name)}
                id={name}
                type="url"
                placeholder={placeholder}
                className="w-full pl-11 pr-10 py-3.5 bg-zinc-800/20 border border-zinc-800/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-200"
              />
              {watch(name)?.trim() && !errors[name] && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                </motion.div>
              )}
            </div>
            {errors[name] && (
              <p className="text-red-400 text-xs mt-1.5">{errors[name]?.message}</p>
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 pt-8"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm text-zinc-500 hover:text-zinc-300 font-medium rounded-xl transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("back")}
            </button>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
            >
              {t("continue")}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2.5 text-zinc-600 hover:text-zinc-400 font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-xs"
          >
            <SkipForward className="w-3 h-3" />
            {t("skipStep")}
          </button>
        </motion.div>
      </form>
    </div>
  )
}
