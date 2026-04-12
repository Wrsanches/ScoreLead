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
  Copy,
  Check,
  Radar,
  Building2,
  ChevronDown,
  Users,
} from "lucide-react"
import { MobileMenuButton } from "@/components/admin-shell"
import { SectionCard, StatNumber, SocialIcon, getSocialConfig } from "@/components/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelativeDate, getInitials, scoreColor, scoreBadgeClasses } from "@/lib/admin-utils"
import {
  LEAD_STATUS_KEYS,
  STATUS_CONFIG,
  getStatus,
  type Lead,
  type LeadStatus,
} from "./_shared"
import { OutreachMessagesCard } from "./_components/outreach-messages-card"

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const leadListRef = useRef<HTMLDivElement>(null)

  async function copyToClipboard(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400)
    } catch {
      /* noop */
    }
  }

  async function updateLeadStatus(leadId: string, nextStatus: LeadStatus) {
    // Optimistic update
    const previous = leads
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l)),
    )
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error("Failed")
    } catch {
      // Revert on failure
      setLeads(previous)
    }
  }

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
        <div className="px-4 h-[72px] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">{t("leads")}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                <StatNumber value={total} className="text-zinc-400" /> {t("leads").toLowerCase()}
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
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${getStatus(l.status).dot}`} />
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
        className={`fixed inset-y-0 right-0 z-50 w-full bg-zinc-900/30 flex flex-col overflow-hidden transition-transform duration-200 ease-out sm:relative sm:flex sm:flex-1 sm:translate-x-0 ${
          detailOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!lead ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-sm rounded-2xl border border-zinc-800/70 bg-zinc-950/40 px-8 py-10 text-center shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900/70 ring-1 ring-zinc-800">
                <Users className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-300">Select a lead</p>
              <p className="mt-1 text-sm text-zinc-600">
                Open a record from the list to review contact details, scoring, and outreach.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-5 h-[72px] border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/50 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setDetailOpen(false)}
                  className="sm:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors duration-150"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 text-sm min-w-0">
                  <span className="text-zinc-500">{t("leads")}</span>
                  <span className="text-zinc-700">/</span>
                  {[lead.city, lead.country].filter(Boolean).length > 0 && (
                    <>
                      <span className="text-emerald-400 truncate max-w-[140px]">
                        {[lead.city, lead.country].filter(Boolean).join(", ")}
                      </span>
                      <span className="text-zinc-700">/</span>
                    </>
                  )}
                  <span className="text-white font-semibold truncate max-w-[240px]">{lead.name || "Unknown"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="h-8 px-3 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/60 rounded-lg transition-all duration-150 flex items-center gap-1.5"
                    title={`Email ${lead.email}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Email</span>
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="h-8 px-3 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/60 rounded-lg transition-all duration-150 flex items-center gap-1.5"
                    title={`Call ${lead.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Call</span>
                  </a>
                )}
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 text-sm font-medium text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Visit</span>
                  </a>
                )}
                <button
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors duration-150 flex items-center justify-center"
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto scrollbar-hide">
              <div className="w-full max-w-5xl mx-auto">
                {(() => {
                  const statusCfg = getStatus(lead.status)
                  return (
                    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/45 p-5 sm:p-6 mb-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage: `
                            radial-gradient(ellipse 55% 70% at top left, rgba(16,185,129,0.045), transparent 55%),
                            linear-gradient(135deg, rgba(39,39,42,0.45), transparent 48%)
                          `,
                        }}
                      />
                      <div className="relative flex items-start gap-4 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {lead.photoUrl ? (
                            <img
                              src={lead.photoUrl}
                              alt=""
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-1 ring-zinc-700/80 shadow-lg shadow-black/30"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800/80 flex items-center justify-center ring-1 ring-zinc-700/60 shadow-lg shadow-black/25">
                              <span className="text-xl sm:text-2xl font-semibold text-zinc-400">
                                {getInitials(lead.name)}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-zinc-950 ${statusCfg.dot}`} />
                        </div>

                        <div className="min-w-0 pt-0.5">
                          {/* Status pill (clickable) + enriched hint */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.ring}`}
                                  aria-label="Change lead status"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                  {statusCfg.label}
                                  <ChevronDown className="w-3 h-3 opacity-60" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                sideOffset={6}
                                className="w-[200px] bg-zinc-900 border-zinc-700/60 shadow-xl shadow-black/40"
                              >
                                <DropdownMenuLabel className="px-3 py-1.5 text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                                  Change status
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                {LEAD_STATUS_KEYS.map((key) => {
                                  const cfg = STATUS_CONFIG[key]
                                  const isCurrent = key === lead.status
                                  return (
                                    <DropdownMenuItem
                                      key={key}
                                      onClick={() => {
                                        if (!isCurrent) updateLeadStatus(lead.id, key)
                                      }}
                                      className="px-3 py-2 text-zinc-300 focus:text-white focus:bg-zinc-800/70 cursor-pointer"
                                    >
                                      <span className="flex items-center gap-2.5 w-full">
                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                        <span className="flex-1 text-sm">{cfg.label}</span>
                                        {isCurrent && (
                                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        )}
                                      </span>
                                    </DropdownMenuItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {lead.firecrawlEnriched && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800/60 text-zinc-300 ring-1 ring-zinc-700/60">
                                Enriched
                              </span>
                            )}
                          </div>

                          <h2 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight line-clamp-2">
                            {lead.name || "Unknown"}
                          </h2>
                          <p className="text-zinc-400 text-sm mt-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            <span className="truncate">
                              {[lead.city, lead.state, lead.country].filter(Boolean).join(", ") || lead.address || "No location"}
                            </span>
                          </p>

                          {/* Quick facts row */}
                          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                            {lead.googleRating != null && (
                              <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/70 bg-zinc-900/50 px-2.5 py-1.5 text-zinc-400">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <StatNumber value={lead.googleRating.toFixed(1)} className="text-zinc-200 font-medium" />
                                {lead.googleReviewCount != null && (
                                  <span className="text-zinc-600">({lead.googleReviewCount})</span>
                                )}
                              </div>
                            )}
                            {lead.services && lead.services.length > 0 && (
                              <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/70 bg-zinc-900/50 px-2.5 py-1.5 text-zinc-400">
                                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                                <StatNumber value={lead.services.length} className="text-zinc-200 font-medium" />
                                <span className="text-zinc-600">services</span>
                              </div>
                            )}
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/70 bg-zinc-900/50 px-2.5 py-1.5 text-zinc-400">
                              <Radar className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-zinc-500 capitalize">{lead.source.replace("_", " ")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score card */}
                      <div className="relative shrink-0 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 px-4 py-3 ring-1 ring-zinc-800/80 sm:text-right">
                        <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                          {t("score")}
                        </span>
                        <div className="flex items-baseline gap-1 sm:justify-end">
                          <span className={`text-4xl font-semibold tabular-nums tracking-tight ${scoreColor(lead.score)}`}>
                            {lead.score.toFixed(1)}
                          </span>
                          <span className="text-sm text-zinc-600 tabular-nums">/5</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Score breakdown - 5 categories */}
                {lead.scoreBreakdown?.categories && (
                  <div className="border border-zinc-800/70 bg-zinc-950/35 rounded-2xl p-5 mb-6 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div>
                        <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                          Score breakdown
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">Signals grouped by discovery quality.</p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${scoreColor(lead.score)}`}>
                        {lead.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 sm:gap-4">
                      {([
                        { key: "reach", label: t("reach"), color: "bg-emerald-500" },
                        { key: "trust", label: t("trust"), color: "bg-lime-400" },
                        { key: "offer", label: t("engage"), color: "bg-sky-400" },
                        { key: "profile", label: t("match"), color: "bg-emerald-400" },
                        { key: "social", label: t("ready"), color: "bg-amber-400" },
                      ] as const).map((cat) => {
                        const value = lead.scoreBreakdown?.categories[cat.key] ?? 0
                        const barColor = value > 0 ? cat.color : "bg-zinc-800/80"
                        return (
                          <div key={cat.key} className="flex flex-col items-center gap-2 min-w-0">
                            <span className="text-xs text-zinc-300 tabular-nums">{value.toFixed(0)}/5</span>
                            <div className="flex flex-col-reverse gap-[3px] w-full max-w-[40px]">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-full h-[8px] rounded-sm ${
                                    i < value ? barColor : "bg-zinc-800/80"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-zinc-500 font-medium truncate max-w-full">{cat.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Contact + Business cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <SectionCard title="Contact">
                    <div className="space-y-1">
                      {lead.website && (
                        <CopyRow
                          icon={Globe}
                          label={lead.websiteDomain || lead.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 32)}
                          copyValue={lead.website}
                          linkHref={lead.website}
                          external
                          copyKey="website"
                          copiedKey={copiedKey}
                          onCopy={copyToClipboard}
                        />
                      )}
                      {lead.email && (
                        <CopyRow
                          icon={Mail}
                          label={lead.email}
                          copyValue={lead.email}
                          linkHref={`mailto:${lead.email}`}
                          copyKey="email"
                          copiedKey={copiedKey}
                          onCopy={copyToClipboard}
                        />
                      )}
                      {lead.phone && (
                        <CopyRow
                          icon={Phone}
                          label={lead.phone}
                          copyValue={lead.phone}
                          linkHref={`tel:${lead.phone}`}
                          copyKey="phone"
                          copiedKey={copiedKey}
                          onCopy={copyToClipboard}
                        />
                      )}
                      {lead.address && (
                        <CopyRow
                          icon={MapPin}
                          label={lead.address}
                          copyValue={lead.address}
                          copyKey="address"
                          copiedKey={copiedKey}
                          onCopy={copyToClipboard}
                        />
                      )}
                      {lead.instagramHandle && (
                        <CopyRow
                          icon={AtSign}
                          label={`@${lead.instagramHandle}`}
                          copyValue={lead.instagramHandle}
                          copyKey="ig"
                          copiedKey={copiedKey}
                          onCopy={copyToClipboard}
                        />
                      )}
                      {!lead.website && !lead.email && !lead.phone && !lead.address && !lead.instagramHandle && (
                        <p className="text-zinc-600 text-sm py-2">No contact info found.</p>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Business">
                    <div className="space-y-2.5">
                      {lead.ownerName && (
                        <InfoRow icon={User} label="Owner" value={lead.ownerName} />
                      )}
                      {lead.operatingHours && (
                        <InfoRow icon={Clock} label="Hours" value={lead.operatingHours} />
                      )}
                      {!lead.ownerName && !lead.operatingHours && !lead.services?.length && (
                        <p className="text-zinc-600 text-sm py-2">No business data.</p>
                      )}
                      {lead.services && lead.services.length > 0 && (
                        <div className={lead.ownerName || lead.operatingHours ? "pt-2 border-t border-zinc-800/60" : ""}>
                          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-emerald-400" />
                            Services
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {lead.services.map((s) => (
                              <span
                                key={s}
                                className="text-[11px] bg-zinc-800/60 text-zinc-300 px-2 py-1 rounded-md ring-1 ring-zinc-700/60"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* Social media */}
                {lead.socialMedia && Object.keys(lead.socialMedia).length > 0 && (
                  <SectionCard title="Social" className="mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(lead.socialMedia).map(([platform, url]) => {
                        const cfg = getSocialConfig(platform)
                        let preview = url
                        try {
                          const u = new URL(url)
                          preview = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "")
                          if (preview.length > 28) preview = preview.slice(0, 27) + "…"
                        } catch {
                          /* keep raw url */
                        }
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-150 overflow-hidden"
                            title={url}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 transition-all duration-150 ${cfg.bg} ${cfg.ring}`}
                              style={{ color: cfg.color }}
                            >
                              <SocialIcon platform={platform} className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-200 font-medium truncate group-hover:text-white transition-colors">
                                {cfg.label}
                              </p>
                              <p className="text-[11px] text-zinc-600 truncate">{preview}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 shrink-0 transition-colors" />
                          </a>
                        )
                      })}
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

                {/* Mensagens de Abordagem (AI-generated outreach sequence) */}
                <OutreachMessagesCard
                  key={lead.id}
                  leadId={lead.id}
                  initialMessages={lead.outreachMessages}
                  contact={{ email: lead.email, phone: lead.phone }}
                  onMessagesChange={(msgs) => {
                    setLeads((prev) =>
                      prev.map((l) => (l.id === lead.id ? { ...l, outreachMessages: msgs } : l)),
                    )
                  }}
                />


                {/* Google Reviews */}
                {lead.googleReviews && lead.googleReviews.length > 0 && (() => {
                  const reviews = lead.googleReviews
                  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                  return (
                    <SectionCard title="Reviews" className="mb-6">
                      {/* Aggregate header */}
                      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-zinc-800/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl text-white font-semibold tabular-nums tracking-tight">
                            {avg.toFixed(1)}
                          </span>
                          <span className="text-sm text-zinc-600">/5</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-0.5 mb-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-zinc-500 tabular-nums">
                            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {reviews.map((review, i) => (
                          <div key={i} className="py-3 px-3.5 bg-zinc-900/40 rounded-lg border border-zinc-800/60">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-200 font-medium">{review.author}</span>
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
                                <span className="text-[11px] text-zinc-600 tabular-nums">{review.date}</span>
                              )}
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )
                })()}

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
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 mt-1.5 shrink-0" />
                            <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                )}

                {/* Metadata */}
                <div className="pt-6 mt-2 border-t border-zinc-800/70">
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-4">
                    Details
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <MetaCell label="Source" value={lead.source.replace("_", " ")} />
                    <MetaCell label="Enriched" value={lead.firecrawlEnriched ? "Yes" : "No"} />
                    <MetaCell label="Found" value={formatDate(lead.createdAt)} />
                    <MetaCell label="Status" value={getStatus(lead.status).label} />
                    {lead.teamMembers && lead.teamMembers.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                          Team
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.teamMembers.map((m) => (
                            <span
                              key={m.name}
                              className="text-xs bg-zinc-900/60 text-zinc-300 border border-zinc-800 px-2 py-1 rounded-md"
                            >
                              {m.name}
                              {m.role && <span className="text-zinc-600 ml-1">· {m.role}</span>}
                            </span>
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

// ── Helper row components ──────────────────────────────────────

interface CopyRowProps {
  icon: React.ElementType
  label: string
  copyValue: string
  copyKey: string
  copiedKey: string | null
  onCopy: (value: string, key: string) => void
  linkHref?: string
  external?: boolean
}

function CopyRow({
  icon: Icon,
  label,
  copyValue,
  copyKey,
  copiedKey,
  onCopy,
  linkHref,
  external,
}: CopyRowProps) {
  const isCopied = copiedKey === copyKey
  const linkClasses = "flex-1 text-sm text-zinc-300 hover:text-white truncate transition-colors"

  return (
    <div className="group flex items-center gap-2.5 -mx-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/40 transition-colors">
      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
      {linkHref ? (
        <a
          href={linkHref}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={linkClasses}
        >
          {label}
        </a>
      ) : (
        <span className="flex-1 text-sm text-zinc-300 truncate">{label}</span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onCopy(copyValue, copyKey)
        }}
        className={`shrink-0 p-1 rounded-md transition-all duration-150 ${
          isCopied
            ? "text-emerald-400 bg-emerald-500/10 opacity-100"
            : "text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/70 opacity-0 group-hover:opacity-100"
        }`}
        title={isCopied ? "Copied!" : "Copy"}
        aria-label={isCopied ? "Copied" : `Copy ${copyKey}`}
      >
        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5 -mx-2 px-2 py-1.5">
      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className="flex-1 text-sm text-zinc-300 truncate text-right">{value}</span>
    </div>
  )
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm text-zinc-200 capitalize">{value}</p>
    </div>
  )
}
