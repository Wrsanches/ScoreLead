"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TagsInput } from "@/components/admin/tags-input"
import { getTranslatedCategories } from "@/lib/categories"
import { Loader2, Check, Upload, ImageIcon, Building2 } from "lucide-react"

export interface BusinessEditValues {
  name: string
  description: string
  persona: string
  clientPersona: string
  field: string
  category: string
  tags: string
  location: string
  language: string
  logo: string
  website: string
  instagram: string
  facebook: string
  linkedin: string
  other: string
  services: string
  serviceArea: string
  competitors: string
  brandStyle: string
}

interface BusinessEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaults: BusinessEditValues
  onSubmit: (values: BusinessEditValues) => Promise<void>
}

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all"

export function BusinessEditSheet({
  open,
  onOpenChange,
  defaults,
  onSubmit,
}: BusinessEditSheetProps) {
  const t = useTranslations("business")
  const locale = useLocale()
  const categories = getTranslatedCategories(locale)

  const [values, setValues] = useState<BusinessEditValues>(defaults)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) setValues(defaults)
  }, [open, defaults])

  function set<K extends keyof BusinessEditValues>(
    key: K,
    value: BusinessEditValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (saving) return
    if (!values.name.trim()) return
    setSaving(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => {
      set("logo", reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const initials = values.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-xl! w-full bg-zinc-950 border-zinc-800 text-zinc-200 p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-zinc-800 px-5 py-4">
          <SheetTitle className="text-white text-base">
            {t("editBusiness")}
          </SheetTitle>
          <SheetDescription className="text-zinc-500 text-xs">
            {t("editBusinessHint")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Logo + Name row */}
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {values.logo ? (
                  <Image
                    src={values.logo}
                    alt=""
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover"
                    unoptimized
                  />
                ) : initials ? (
                  <span className="text-lg font-semibold text-zinc-300">
                    {initials}
                  </span>
                ) : (
                  <Building2 className="w-6 h-6 text-zinc-600" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t("uploadLogo")}
              >
                <Upload className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
                {t("fieldName")}
              </label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                className={INPUT}
                required
              />
            </div>
          </div>

          {/* Identity group */}
          <Group label={t("groupIdentity")}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fieldField")}>
                <input
                  type="text"
                  value={values.field}
                  onChange={(e) => set("field", e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label={t("fieldCategory")}>
                <select
                  value={values.category}
                  onChange={(e) => set("category", e.target.value)}
                  className={`${INPUT} appearance-none cursor-pointer`}
                >
                  <option value="" className="bg-zinc-900 text-zinc-500">
                    --
                  </option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value} className="bg-zinc-900 text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t("fieldLocation")}>
              <input
                type="text"
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label={t("fieldTags")}>
              <TagsInput
                value={values.tags}
                onChange={(v) => set("tags", v)}
                placeholder=""
                maxTags={15}
                inputClassName={INPUT}
                chipClassName="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium"
                chipRemoveClassName="text-emerald-400/60 hover:text-emerald-300 transition-colors"
              />
            </Field>
          </Group>

          {/* Story group */}
          <Group label={t("groupStory")}>
            <Field label={t("fieldDescription")}>
              <textarea
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                className={`${INPUT} resize-none`}
              />
            </Field>
            <Field label={t("fieldPersona")}>
              <textarea
                value={values.persona}
                onChange={(e) => set("persona", e.target.value)}
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </Field>
            <Field label={t("fieldClientPersona")}>
              <textarea
                value={values.clientPersona}
                onChange={(e) => set("clientPersona", e.target.value)}
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </Field>
          </Group>

          {/* Links */}
          <Group label={t("groupLinks")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t("fieldWebsite")}>
                <input
                  type="url"
                  value={values.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://"
                  className={INPUT}
                />
              </Field>
              <Field label={t("fieldInstagram")}>
                <input
                  type="url"
                  value={values.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  placeholder="https://instagram.com/..."
                  className={INPUT}
                />
              </Field>
              <Field label={t("fieldFacebook")}>
                <input
                  type="url"
                  value={values.facebook}
                  onChange={(e) => set("facebook", e.target.value)}
                  placeholder="https://facebook.com/..."
                  className={INPUT}
                />
              </Field>
              <Field label={t("fieldLinkedin")}>
                <input
                  type="url"
                  value={values.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/..."
                  className={INPUT}
                />
              </Field>
              <Field label={t("fieldOther")}>
                <input
                  type="url"
                  value={values.other}
                  onChange={(e) => set("other", e.target.value)}
                  placeholder="https://"
                  className={INPUT}
                />
              </Field>
            </div>
          </Group>

          {/* Discovery */}
          <Group label={t("groupDiscovery")}>
            <Field label={t("services")}>
              <textarea
                value={values.services}
                onChange={(e) => set("services", e.target.value)}
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </Field>
            <Field label={t("serviceArea")}>
              <input
                type="text"
                value={values.serviceArea}
                onChange={(e) => set("serviceArea", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label={t("competitors")}>
              <textarea
                value={values.competitors}
                onChange={(e) => set("competitors", e.target.value)}
                rows={2}
                className={`${INPUT} resize-none`}
              />
            </Field>
          </Group>

          {/* Brand style */}
          <Group label={t("brand")}>
            <Field label={t("brandStyle")}>
              <textarea
                value={values.brandStyle}
                onChange={(e) => set("brandStyle", e.target.value)}
                rows={2}
                className={`${INPUT} resize-none`}
                placeholder="Modern, warm, editorial..."
              />
            </Field>
          </Group>

          <div className="flex items-center gap-2 text-[10px] text-zinc-600 pt-2 border-t border-zinc-800/60">
            <ImageIcon className="w-3 h-3" />
            {t("editColorsHint")}
          </div>
        </div>

        <div className="border-t border-zinc-800 px-5 py-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !values.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {t("save")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
