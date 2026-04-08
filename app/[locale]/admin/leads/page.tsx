"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useSearch } from "@/components/search-overlay"
import {
  Mail,
  MoreHorizontal,
  Globe,
  Phone,
  Star,
  AtSign,
  ArrowLeft,
  ExternalLink,
  MapPin,
  User,
  Clock,
  Tag,
} from "lucide-react"
import { MobileMenuButton } from "@/components/admin-shell"
import { ScoreBadge, SectionCard } from "@/components/admin"
import { formatRelativeDate, getInitials, scoreColor, scoreBadgeClasses } from "@/lib/admin-utils"

interface Lead {
  id: string
  name: string | null
  website: string | null
  websiteDomain: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  description: string | null
  photoUrl: string | null
  googleRating: number | null
  googleReviews: { author: string; rating: number; text: string; date: string }[] | null
  googleReviewCount: number | null
  socialMedia: Record<string, string> | null
  instagramHandle: string | null
  services: string[] | null
  ownerName: string | null
  teamMembers: { name: string; role?: string }[] | null
  operatingHours: string | null
  pricingInfo: string | null
  aiSummary: string | null
  score: number
  scoreBreakdown: {
    positives: { label: string; value: number; category: string }[]
    risks: { label: string; value: number; category: string }[]
    categories: Record<string, number>
  } | null
  source: string
  firecrawlEnriched: boolean
  status: string
  createdAt: string
}

export default function LeadsPage() {
  const t = useTranslations("dashboard")
  const { selectedLeadId, clearSelectedLead } = useSearch()
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const leadListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch(`/api/leads?page=${page}&limit=50&sortBy=score&sortOrder=desc`)
        if (res.ok) {
          const data = await res.json()
          setLeads(data.leads)
          setTotalPages(data.totalPages)
          setTotal(data.total)
        }
      } catch {
        // Failed to fetch
      }
      setIsLoading(false)
    }
    fetchLeads()
  }, [page])

  // Handle search selection
  useEffect(() => {
    if (!selectedLeadId || leads.length === 0) return

    const idx = leads.findIndex((l) => l.id === selectedLeadId)
    if (idx >= 0) {
      setSelectedIndex(idx)
      setDetailOpen(true)
      clearSelectedLead()
    } else {
      // Lead not on current page - fetch it directly and prepend
      fetch(`/api/leads/${selectedLeadId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((targetLead) => {
          if (targetLead) {
            setLeads((prev) => [targetLead, ...prev])
            setSelectedIndex(0)
            setDetailOpen(true)
          }
          clearSelectedLead()
        })
        .catch(() => clearSelectedLead())
    }
  }, [selectedLeadId, leads, clearSelectedLead])

  const lead = leads[selectedIndex] || null

  const handleSelectLead = useCallback((i: number) => {
    setSelectedIndex(i)
    setDetailOpen(true)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, leads.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      setDetailOpen(true)
    }
  }, [leads.length])

  const statusColors: Record<string, string> = {
    new: "bg-emerald-500",
    contacted: "bg-blue-500",
    interested: "bg-amber-500",
    not_interested: "bg-zinc-500",
    customer: "bg-emerald-400",
  }

  const formatDate = formatRelativeDate

  return (
    <div className="flex h-full w-full overflow-hidden">
      {detailOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setDetailOpen(false)}
        />
      )}

      {/* Lead list */}
      <div className="w-full sm:w-[340px] h-full bg-zinc-900/30 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-4 p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">{t("leads")}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                <span className="text-zinc-400 tabular-nums">{total}</span> {t("leads").toLowerCase()}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/70 px-2.5 py-1.5 rounded-lg border border-zinc-800 transition-all duration-150">
            <span className="text-zinc-200">{t("score")}</span>
            <span aria-hidden="true" className="text-zinc-500">&darr;</span>
          </button>
        </div>

        <div
          ref={leadListRef}
          className="relative flex-1 overflow-auto scrollbar-hide"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse mt-1.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded-md animate-pulse w-3/4" />
                    <div className="h-3 bg-zinc-800/60 rounded-md animate-pulse w-1/2" />
                  </div>
                  <div className="h-5 w-10 bg-zinc-800 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <p className="text-zinc-400 text-sm mb-1">No leads yet</p>
              <p className="text-zinc-600 text-xs">Run a discovery job to find leads.</p>
            </div>
          ) : (
            <>
              {leads.map((l, i) => (
                <div
                  key={l.id}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onClick={() => handleSelectLead(i)}
                  className={`group px-4 py-3.5 cursor-pointer transition-all duration-150 ${
                    i === selectedIndex
                      ? "bg-emerald-500/5 border-l-[3px] border-l-emerald-500"
                      : "border-l-[3px] border-l-transparent hover:bg-zinc-800/25 hover:translate-x-0.5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {l.photoUrl ? (
                        <img
                          src={l.photoUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-zinc-500">{getInitials(l.name)}</span>
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusColors[l.status] || "bg-zinc-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate leading-tight transition-colors ${i === selectedIndex ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                        {l.name || "Unknown"}
                      </p>
                      <p className="text-zinc-500 text-xs mt-1 truncate">
                        {[l.city, l.state, l.country].filter(Boolean).join(", ") || l.address || l.websiteDomain || "No location"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${scoreBadgeClasses(l.score)}`}>
                        {l.score.toFixed(1)}
                      </span>
                      <span className="text-zinc-600 text-xs shrink-0 tabular-nums">{formatDate(l.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-3 border-t border-zinc-800/40">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="text-xs text-zinc-500 hover:text-white disabled:opacity-40 px-2 py-1"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-zinc-600 tabular-nums">{page}/{totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="text-xs text-zinc-500 hover:text-white disabled:opacity-40 px-2 py-1"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full bg-zinc-950 flex flex-col overflow-hidden transition-transform duration-200 ease-out sm:relative sm:flex sm:flex-1 sm:translate-x-0 ${
          detailOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!lead ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">Select a lead to view details</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailOpen(false)}
                  className="sm:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors duration-150"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-zinc-500">{t("leads")}</span>
                  <span className="text-zinc-700">/</span>
                  <span className="text-white font-semibold truncate max-w-[200px]">{lead.name || "Unknown"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-lg transition-all duration-150 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit
                  </a>
                )}
                <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors duration-150">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto scrollbar-hide">
              <div className="w-full 2xl:max-w-3xl 2xl:mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {lead.photoUrl ? (
                      <img
                        src={lead.photoUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                        <span className="text-lg font-medium text-zinc-500">{getInitials(lead.name)}</span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-white text-2xl font-semibold tracking-tight line-clamp-2">{lead.name || "Unknown"}</h2>
                      <p className="text-zinc-500 text-base mt-1">
                        {[lead.city, lead.state, lead.country].filter(Boolean).join(", ") || lead.address || "No location"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-500">{t("score")}</span>
                    <div className="flex items-baseline gap-1 bg-zinc-800/60 px-3 py-1.5 rounded-lg">
                      <span className={`font-semibold text-xl tabular-nums ${scoreColor(lead.score)}`}>{lead.score.toFixed(1)}</span>
                      <span className="text-sm text-zinc-600">/5</span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown - 5 categories */}
                {lead.scoreBreakdown?.categories && (
                  <div className="border border-zinc-800/60 rounded-xl p-5 mb-6">
                    <div className="flex items-end gap-4">
                      {([
                        { key: "reach", label: t("reach"), color: "bg-emerald-500" },
                        { key: "trust", label: t("trust"), color: "bg-emerald-500" },
                        { key: "offer", label: t("engage"), color: "bg-blue-500" },
                        { key: "profile", label: t("match"), color: "bg-emerald-500" },
                        { key: "social", label: t("ready"), color: "bg-amber-500" },
                      ] as const).map((cat) => {
                        const value = lead.scoreBreakdown?.categories[cat.key] ?? 0
                        const barColor = value >= 4 ? "bg-emerald-500" : value >= 2.5 ? "bg-blue-500" : value > 0 ? "bg-amber-500" : "bg-zinc-800/80"
                        return (
                          <div key={cat.key} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-xs text-zinc-400 tabular-nums">{value.toFixed(0)}/5</span>
                            <div className="flex flex-col-reverse gap-[3px] w-full max-w-[36px]">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-full h-[8px] rounded-sm ${
                                    i < value ? barColor : "bg-zinc-800/80"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{cat.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Contact + Discovery cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <SectionCard title="Contact" className="space-y-3">
                    {lead.website && (
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline truncate">
                          {lead.websiteDomain || lead.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}
                        </a>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                        <a href={`mailto:${lead.email}`} className="text-zinc-300 text-sm hover:text-white">{lead.email}</a>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 text-sm">{lead.phone}</span>
                      </div>
                    )}
                    {lead.address && (
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 text-sm truncate">{lead.address}</span>
                      </div>
                    )}
                    {!lead.website && !lead.email && !lead.phone && (
                      <p className="text-zinc-600 text-sm">No contact info found</p>
                    )}
                  </SectionCard>

                  <SectionCard title={t("discovery")} className="space-y-3">
                    {lead.googleRating != null && (
                      <div className="flex items-center gap-2.5">
                        <Star className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-zinc-300 text-sm">{lead.googleRating.toFixed(1)}</span>
                        {lead.googleReviewCount != null && (
                          <span className="text-zinc-500 text-sm">({lead.googleReviewCount} reviews)</span>
                        )}
                      </div>
                    )}
                    {lead.instagramHandle && (
                      <div className="flex items-center gap-2.5">
                        <AtSign className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 text-sm">@{lead.instagramHandle}</span>
                      </div>
                    )}
                    {lead.ownerName && (
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 text-sm">{lead.ownerName}</span>
                      </div>
                    )}
                    {lead.operatingHours && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 text-sm truncate">{lead.operatingHours}</span>
                      </div>
                    )}
                    {lead.services && lead.services.length > 0 && (
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {lead.services.map((s) => (
                            <span key={s} className="text-xs bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-lg border border-zinc-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!lead.googleRating && !lead.instagramHandle && !lead.services?.length && (
                      <p className="text-zinc-600 text-sm">No discovery data</p>
                    )}
                  </SectionCard>
                </div>

                {/* Social media */}
                {lead.socialMedia && Object.keys(lead.socialMedia).length > 0 && (
                  <SectionCard title="Social" className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(lead.socialMedia).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-zinc-800/80 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors capitalize flex items-center gap-1.5"
                        >
                          <Tag className="w-3 h-3" />
                          {platform}
                        </a>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* AI Summary */}
                {lead.aiSummary && (
                  <SectionCard title="AI Summary" className="mb-6">
                    <p className="text-zinc-300 text-sm leading-relaxed">{lead.aiSummary}</p>
                  </SectionCard>
                )}

                {/* Description */}
                {lead.description && !lead.aiSummary && (
                  <SectionCard title="Description" className="mb-6">
                    <p className="text-zinc-300 text-sm leading-relaxed">{lead.description}</p>
                  </SectionCard>
                )}

                {/* Google Reviews */}
                {lead.googleReviews && lead.googleReviews.length > 0 && (
                  <SectionCard title={`Reviews (${lead.googleReviews.length})`} className="mb-6">
                    <div className="space-y-3">
                      {lead.googleReviews.map((review, i) => (
                        <div key={i} className="py-2.5 px-3 bg-zinc-800/30 rounded-lg">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-zinc-300 font-medium">{review.author}</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <Star
                                    key={si}
                                    className={`w-3 h-3 ${si < review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.date && (
                              <span className="text-[11px] text-zinc-600">{review.date}</span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm leading-relaxed">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Pricing */}
                {lead.pricingInfo && (
                  <SectionCard title="Pricing" className="mb-6">
                    <div className="space-y-2.5">
                      {lead.pricingInfo
                        .split(/[|;\n]/)
                        .map((item) => item.trim())
                        .filter((item) => item.length > 5)
                        .map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-1.5 px-3 bg-zinc-800/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                            <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                )}

                {/* Metadata */}
                <div className="pt-5 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Details</p>
                  <div className="space-y-px">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                      <span className="flex-1 text-sm text-zinc-500">Source</span>
                      <span className="text-sm text-zinc-300 capitalize">{lead.source.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                      <span className="flex-1 text-sm text-zinc-500">Enriched</span>
                      <span className="text-sm text-zinc-300">{lead.firecrawlEnriched ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                      <span className="flex-1 text-sm text-zinc-500">Found</span>
                      <span className="text-sm text-zinc-300">{formatDate(lead.createdAt)}</span>
                    </div>
                    {lead.teamMembers && lead.teamMembers.length > 0 && (
                      <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg">
                        <span className="flex-1 text-sm text-zinc-500">Team</span>
                        <div className="text-sm text-zinc-300 text-right">
                          {lead.teamMembers.map((m) => (
                            <div key={m.name}>{m.name}{m.role ? ` (${m.role})` : ""}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
