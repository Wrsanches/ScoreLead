"use client"

import { use, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  Building2,
  Globe,
  Link2,
  MapPin,
  Languages,
  Tag,
  Palette,
  Type,
  Target,
  Pencil,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import {
  PageHeader,
  ContentWrapper,
  SectionCard,
  LoadingState,
  EmptyState,
  BrandColorPicker,
} from "@/components/admin"
import {
  BusinessEditSheet,
  type BusinessEditValues,
} from "@/components/admin/business-edit-sheet"

interface Business {
  id: string
  name: string | null
  description: string | null
  persona: string | null
  clientPersona: string | null
  field: string | null
  category: string | null
  tags: string | null
  logo: string | null
  language: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  other: string | null
  location: string | null
  brandColors: string[] | null
  brandColorPrimary: string | null
  brandColorSecondary: string | null
  brandFonts: string[] | null
  brandStyle: string | null
  services: string | null
  serviceArea: string | null
  competitors: string | null
  suggestedKeywords: string[] | null
}

function getFaviconUrl(website: string | null): string | null {
  if (!website) return null
  try {
    const domain = new URL(website).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return null
  }
}

function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) return parsed.filter((t) => typeof t === "string")
  } catch {
    // fall through
  }
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function LinkRow({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-150"
    >
      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
      <span className="flex-1 text-sm text-zinc-300 truncate">{label}</span>
      <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
    </a>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">
        {label}
      </p>
      <div className="text-sm text-zinc-200">{children}</div>
    </div>
  )
}

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("business")
  const tOnb = useTranslations("onboarding")
  const [data, setData] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshingBrand, setRefreshingBrand] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [brandError, setBrandError] = useState<string | null>(null)

  async function refreshBrand() {
    if (!data?.website) {
      setBrandError(t("refreshNeedsWebsite"))
      return
    }
    setRefreshingBrand(true)
    setBrandError(null)
    try {
      const res = await fetch(`/api/businesses/${id}/brand`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || "Failed to refresh brand")
      }
      setData((prev) => {
        if (!prev) return prev
        const nextColors: string[] | null = body.brandColors ?? null
        const nextSet = new Set((nextColors || []).map((c) => c.toLowerCase()))
        const keepPrimary =
          prev.brandColorPrimary && nextSet.has(prev.brandColorPrimary.toLowerCase())
            ? prev.brandColorPrimary
            : null
        const keepSecondary =
          prev.brandColorSecondary && nextSet.has(prev.brandColorSecondary.toLowerCase())
            ? prev.brandColorSecondary
            : null
        return {
          ...prev,
          brandColors: nextColors,
          brandFonts: body.brandFonts ?? null,
          brandStyle: body.brandStyle ?? null,
          brandColorPrimary: keepPrimary,
          brandColorSecondary: keepSecondary,
        }
      })
    } catch (e) {
      setBrandError(e instanceof Error ? e.message : "Failed to refresh brand")
    } finally {
      setRefreshingBrand(false)
    }
  }

  async function updateBrandColors(update: {
    brandColorPrimary?: string | null
    brandColorSecondary?: string | null
  }) {
    const previous = data
    setData((prev) => (prev ? { ...prev, ...update } : prev))
    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error("Failed")
    } catch {
      setData(previous)
    }
  }

  async function handleEditSave(values: BusinessEditValues) {
    const previous = data
    // Optimistic merge so the page reflects the edit instantly.
    setData((prev) =>
      prev
        ? {
            ...prev,
            name: values.name,
            description: values.description || null,
            persona: values.persona || null,
            clientPersona: values.clientPersona || null,
            field: values.field || null,
            category: values.category || null,
            tags: values.tags || null,
            location: values.location || null,
            language: values.language || prev.language,
            logo: values.logo || null,
            website: values.website || null,
            instagram: values.instagram || null,
            facebook: values.facebook || null,
            linkedin: values.linkedin || null,
            other: values.other || null,
            services: values.services || null,
            serviceArea: values.serviceArea || null,
            competitors: values.competitors || null,
            brandStyle: values.brandStyle || null,
          }
        : prev,
    )
    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed")
    } catch {
      setData(previous)
      throw new Error("Save failed")
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/businesses/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || "Failed to load business")
        }
        return res.json()
      })
      .then((b: Business) => {
        if (!cancelled) setData(b)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const logo = data?.logo || getFaviconUrl(data?.website || null)
  const initials = (data?.name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const tags = parseTags(data?.tags || null)
  const hasBrandColors = !!(data?.brandColors && data.brandColors.length > 0)
  const hasBrandFonts = !!(data?.brandFonts && data.brandFonts.length > 0)
  const hasBrandStyle = !!data?.brandStyle
  const hasBrand = hasBrandColors || hasBrandFonts || hasBrandStyle

  const socials: { icon: React.ElementType; href: string; label: string }[] = []
  if (data?.website) socials.push({ icon: Globe, href: data.website, label: data.website })
  if (data?.instagram) socials.push({ icon: Link2, href: data.instagram, label: data.instagram })
  if (data?.facebook) socials.push({ icon: Link2, href: data.facebook, label: data.facebook })
  if (data?.linkedin) socials.push({ icon: Link2, href: data.linkedin, label: data.linkedin })
  if (data?.other) socials.push({ icon: Link2, href: data.other, label: data.other })

  return (
    <>
      <PageHeader
        title={data?.name || t("title")}
        backHref="/admin"
        breadcrumbs={[{ label: t("title") }]}
      />

      <div className="flex-1 overflow-auto">
        <ContentWrapper>
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <EmptyState title={error || "Business not found"} />
          ) : (
            <div className="space-y-6">
              {/* Hero */}
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
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
                    <span className="text-2xl font-semibold text-zinc-300">{initials}</span>
                  ) : (
                    <Building2 className="w-8 h-8 text-zinc-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl text-white font-medium tracking-tight">
                    {data.name || t("untitled")}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-zinc-400">
                    {data.field && (
                      <span className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-zinc-600" />
                        {data.field}
                      </span>
                    )}
                    {data.category && (
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-zinc-600" />
                        {data.category}
                      </span>
                    )}
                    {data.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                        {data.location}
                      </span>
                    )}
                    {data.language && (
                      <span className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-zinc-600" />
                        {data.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 text-sm text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 hover:text-white rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t("edit")}
                </button>
              </div>

              {/* Description + Tags */}
              {(data.description || tags.length > 0) && (
                <SectionCard title={t("overview")}>
                  <div className="space-y-4">
                    {data.description && (
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {data.description}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Audience */}
              {(data.persona || data.clientPersona) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.persona && (
                    <SectionCard title={tOnb("reviewPersona")}>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {data.persona}
                      </p>
                    </SectionCard>
                  )}
                  {data.clientPersona && (
                    <SectionCard title={tOnb("reviewClientPersona")}>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {data.clientPersona}
                      </p>
                    </SectionCard>
                  )}
                </div>
              )}

              {/* Brand */}
              <SectionCard
                title={t("brand")}
                accent="emerald"
                actions={
                  data.website ? (
                    <button
                      type="button"
                      onClick={refreshBrand}
                      disabled={refreshingBrand}
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-2.5 py-1.5 rounded-md hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${refreshingBrand ? "animate-spin" : ""}`}
                      />
                      {refreshingBrand ? t("refreshing") : t("refresh")}
                    </button>
                  ) : undefined
                }
              >
                {brandError && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{brandError}</span>
                  </div>
                )}
                {hasBrand ? (
                  <div className="space-y-5">
                    {hasBrandColors && (
                      <Field label={t("brandColors")}>
                        <BrandColorPicker
                          colors={data.brandColors!}
                          primary={data.brandColorPrimary}
                          secondary={data.brandColorSecondary}
                          onPrimaryChange={(color) =>
                            updateBrandColors({ brandColorPrimary: color })
                          }
                          onSecondaryChange={(color) =>
                            updateBrandColors({ brandColorSecondary: color })
                          }
                        />
                      </Field>
                    )}
                    {hasBrandFonts && (
                      <Field label={t("brandFonts")}>
                        <div className="flex flex-wrap gap-2">
                          {data.brandFonts!.map((font) => (
                            <span
                              key={font}
                              className="inline-flex items-center gap-1.5 text-sm text-zinc-200 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg"
                              style={{ fontFamily: `"${font}", system-ui, sans-serif` }}
                            >
                              <Type className="w-3.5 h-3.5 text-zinc-500" />
                              {font}
                            </span>
                          ))}
                        </div>
                      </Field>
                    )}
                    {hasBrandStyle && (
                      <Field label={t("brandStyle")}>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {data.brandStyle}
                        </p>
                      </Field>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                      <Palette className="w-5 h-5 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-400">{t("noBrand")}</p>
                    <p className="text-xs text-zinc-600 mt-1">{t("noBrandHint")}</p>
                  </div>
                )}
              </SectionCard>

              {/* Links */}
              {socials.length > 0 && (
                <SectionCard title={t("links")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {socials.map((s) => (
                      <LinkRow key={s.href} icon={s.icon} label={s.label} href={s.href} />
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Discovery */}
              {(data.services || data.serviceArea || data.competitors || (data.suggestedKeywords && data.suggestedKeywords.length > 0)) && (
                <SectionCard title={t("discovery")}>
                  <div className="space-y-4">
                    {data.services && (
                      <Field label={t("services")}>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                          {data.services}
                        </p>
                      </Field>
                    )}
                    {data.serviceArea && (
                      <Field label={t("serviceArea")}>
                        <p className="text-sm text-zinc-300">{data.serviceArea}</p>
                      </Field>
                    )}
                    {data.competitors && (
                      <Field label={t("competitors")}>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                          {data.competitors}
                        </p>
                      </Field>
                    )}
                    {data.suggestedKeywords && data.suggestedKeywords.length > 0 && (
                      <Field label={t("suggestedKeywords")}>
                        <div className="flex flex-wrap gap-2">
                          {data.suggestedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-xs text-zinc-300 bg-zinc-800/60 border border-zinc-800 px-2.5 py-1 rounded-lg"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </Field>
                    )}
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </ContentWrapper>
      </div>

      {data && (
        <BusinessEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          defaults={{
            name: data.name ?? "",
            description: data.description ?? "",
            persona: data.persona ?? "",
            clientPersona: data.clientPersona ?? "",
            field: data.field ?? "",
            category: data.category ?? "",
            tags: data.tags ?? "",
            location: data.location ?? "",
            language: data.language ?? "",
            logo: data.logo ?? "",
            website: data.website ?? "",
            instagram: data.instagram ?? "",
            facebook: data.facebook ?? "",
            linkedin: data.linkedin ?? "",
            other: data.other ?? "",
            services: data.services ?? "",
            serviceArea: data.serviceArea ?? "",
            competitors: data.competitors ?? "",
            brandStyle: data.brandStyle ?? "",
          }}
          onSubmit={handleEditSave}
        />
      )}
    </>
  )
}
