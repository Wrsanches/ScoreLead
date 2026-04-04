"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  Inbox,
  Users,
  Radar,
  Bookmark,
  CircleDot,
  Send,
  ThumbsUp,
  Trophy,
  Mail,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  MoreHorizontal,
  Sparkles,
  Settings,
  Globe,
  Phone,
  Star,
  AtSign,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react"
import { ScoreLeadLogo } from "@/components/scorelead-logo"

const leads = [
  { nameKey: "lead1", locationKey: "lead1Location", score: 4.5, status: "new", time: "2h" },
  { nameKey: "lead2", locationKey: "lead2Location", score: 4.0, status: "contacted", time: "1d" },
  { nameKey: "lead3", locationKey: "lead3Location", score: 3.5, status: "new", time: "1d" },
  { nameKey: "lead4", locationKey: "lead4Location", score: 4.5, status: "interested", time: "3d" },
  { nameKey: "lead5", locationKey: "lead5Location", score: 3.0, status: "new", time: "3d" },
  { nameKey: "lead6", locationKey: "lead6Location", score: 2.5, status: "contacted", time: "5d" },
  { nameKey: "lead7", locationKey: "lead7Location", score: 4.0, status: "new", time: "1w" },
  { nameKey: "lead8", locationKey: "lead8Location", score: 3.5, status: "contacted", time: "1w" },
] as const

export default function AdminPage() {
  const t = useTranslations("dashboard")
  const [selectedLead, setSelectedLead] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const lead = leads[selectedLead]

  const handleSelectLead = useCallback((i: number) => {
    setSelectedLead(i)
    setDetailOpen(true)
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {detailOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setDetailOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/60 flex flex-col shrink-0 transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <ScoreLeadLogo className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm tracking-tight">ScoreLead</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-zinc-800/40 rounded-lg text-zinc-500 text-sm cursor-pointer hover:bg-zinc-800/70 border border-zinc-700/30 transition-all duration-150">
            <Search className="w-4 h-4" />
            <span>{t("searchLeads")}</span>
            <span className="ml-auto text-xs bg-zinc-700/60 text-zinc-400 px-1.5 py-0.5 rounded font-medium">&#8984;K</span>
          </div>
        </div>

        <div className="px-3 space-y-0.5">
          <NavItem icon={Inbox} label={t("inbox")} badge={5} />
          <NavItem icon={Users} label={t("allLeads")} active />
        </div>

        <div className="mt-6 px-3">
          <div className="px-2.5 py-1 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
            {t("discovery")}
          </div>
          <div className="space-y-0.5 mt-1.5">
            <NavItem icon={Radar} label={t("discoveryJobs")} hasSubmenu />
            <NavItem icon={Bookmark} label={t("savedSearches")} hasSubmenu />
          </div>
        </div>

        <div className="mt-6 px-3">
          <div className="px-2.5 py-1 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
            {t("pipeline")}
          </div>
          <div className="space-y-0.5 mt-1.5">
            <NavItem icon={CircleDot} label={t("new")} color="text-emerald-400" badge={142} />
            <NavItem icon={Send} label={t("contacted")} color="text-blue-400" />
            <NavItem icon={ThumbsUp} label={t("interested")} color="text-amber-400" />
            <NavItem icon={Trophy} label={t("customers")} color="text-emerald-400" />
          </div>
        </div>

        <div className="mt-6 px-3 flex-1">
          <div className="px-2.5 py-1 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
            {t("tools")}
          </div>
          <div className="space-y-0.5 mt-1.5">
            <NavItem icon={Mail} label={t("outreach")} hasSubmenu />
            <NavItem icon={Download} label={t("export")} />
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800/60">
          <NavItem icon={Settings} label={t("settings")} />
        </div>
      </aside>

      <div className="w-full sm:w-[340px] h-full bg-zinc-900/30 border-r border-zinc-800/50 flex flex-col shrink-0">
        <div className="px-4 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-white font-semibold text-base tracking-tight">{t("leads")}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">8 {t("leads").toLowerCase()}</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/70 px-2.5 py-1.5 rounded-md border border-zinc-700/30 transition-all duration-150">
            <span>{t("score")}</span>
            <span aria-hidden="true" className="text-zinc-500">&darr;</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide">
          {leads.map((l, i) => (
            <LeadItem
              key={l.nameKey}
              name={t(l.nameKey)}
              location={t(l.locationKey)}
              score={l.score}
              status={l.status}
              time={l.time}
              active={i === selectedLead}
              onClick={() => handleSelectLead(i)}
            />
          ))}
        </div>
      </div>

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full bg-zinc-950 flex flex-col overflow-hidden transition-transform duration-200 ease-out sm:relative sm:flex sm:flex-1 sm:translate-x-0 ${
          detailOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDetailOpen(false)}
              className="sm:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-zinc-500">{t("discovery")}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-300">{t(lead.locationKey)}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-300 font-medium">{t(lead.nameKey)}</span>
            </div>
          </div>
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-auto scrollbar-hide">
          <div className="w-full 2xl:max-w-3xl 2xl:mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-white text-2xl font-semibold tracking-tight">{t(lead.nameKey)}</h2>
                <p className="text-zinc-500 text-base mt-1">{t(lead.locationKey)}</p>
              </div>
              <ScoreBadge score={lead.score} label={t("score")} />
            </div>

            <div className="bg-zinc-900/60 rounded-xl p-4 mb-6 border border-zinc-800/40">
              <div className="flex items-end gap-3">
                {[
                  { label: t("reach"), value: 5, color: "bg-emerald-500" },
                  { label: t("trust"), value: 4, color: "bg-emerald-500" },
                  { label: t("engage"), value: 4, color: "bg-blue-500" },
                  { label: t("match"), value: 5, color: "bg-emerald-500" },
                  { label: t("ready"), value: 3, color: "bg-amber-500" },
                ].map((signal) => (
                  <div key={signal.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="flex flex-col-reverse gap-[3px] w-full max-w-[28px]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-full h-[6px] rounded-sm transition-colors ${
                            i < signal.value ? `${signal.color} shadow-sm` : "bg-zinc-800/80"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-blue-400 text-sm">sunsetyoga.com</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-zinc-300 text-sm">hello@sunsetyoga.com</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-zinc-300 text-sm">(415) 555-0142</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-zinc-300 text-sm">4.7</span>
                  <span className="text-zinc-500 text-sm">(128 {t("reviews")})</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <AtSign className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-zinc-300 text-sm">@sunsetyogasf</span>
                  <span className="text-zinc-500 text-sm">- 2.4k {t("followers")}</span>
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-zinc-500 font-medium">{t("services")}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[t("serviceYoga"), t("servicePilates"), t("serviceMeditation")].map((s) => (
                      <span key={s} className="text-xs bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-md border border-zinc-700/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-zinc-500 font-medium">{t("booking")}</span>
              <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded-md font-medium border border-amber-500/20">
                {t("highOpportunity")}
              </span>
            </div>

            <div className="pt-5 border-t border-zinc-800/40">
              <div className="text-sm text-zinc-500 font-semibold mb-4 uppercase tracking-widest">{t("activity")}</div>
              <div className="space-y-1">
                <ActivityItem
                  icon={Sparkles}
                  text={t("enrichmentCompleted")}
                  time={t("hoursAgo")}
                />
                <ActivityItem
                  icon={Mail}
                  text={t("outreachGenerated")}
                  time={t("hoursAgo")}
                />
                <ActivityItem
                  icon={Radar}
                  text={t("discoveredVia")}
                  time={t("hoursAgo")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 4
      ? "text-emerald-400"
      : score >= 3
        ? "text-amber-400"
        : "text-red-400"

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-zinc-500">{label}</span>
      <div className="flex items-baseline gap-1 bg-zinc-800/60 px-3 py-1.5 rounded-md">
        <span className={`font-semibold text-xl tabular-nums ${color}`}>{score.toFixed(1)}</span>
        <span className="text-sm text-zinc-600">/5</span>
      </div>
    </div>
  )
}

function NavItem({
  icon: Icon,
  label,
  badge,
  active,
  hasSubmenu,
  color,
}: {
  icon: React.ElementType
  label: string
  badge?: number
  active?: boolean
  hasSubmenu?: boolean
  color?: string
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
        active
          ? "bg-zinc-800/80 text-white shadow-sm shadow-black/20"
          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${color || ""}`} />
      <span className="flex-1 text-sm">{label}</span>
      {badge !== undefined && (
        <span className="bg-zinc-700/60 text-zinc-300 text-xs min-w-[20px] h-[20px] flex items-center justify-center rounded-full font-medium px-1.5">
          {badge}
        </span>
      )}
      {hasSubmenu && <ChevronRight className="w-3 h-3 text-zinc-600" />}
    </div>
  )
}

function LeadItem({
  name,
  location,
  score,
  status,
  time,
  active,
  onClick,
}: {
  name: string
  location: string
  score: number
  status: string
  time: string
  active?: boolean
  onClick: () => void
}) {
  const scoreColor =
    score >= 4
      ? "text-emerald-400 bg-emerald-500/10"
      : score >= 3
        ? "text-amber-400 bg-amber-500/10"
        : "text-red-400 bg-red-500/10"

  const statusColors: Record<string, string> = {
    new: "bg-emerald-500",
    contacted: "bg-blue-500",
    interested: "bg-amber-500",
    customer: "bg-emerald-400",
  }

  return (
    <div
      onClick={onClick}
      className={`group px-4 py-3.5 border-b border-zinc-800/25 cursor-pointer transition-all duration-150 ${
        active
          ? "bg-zinc-800/50 border-l-2 border-l-emerald-500"
          : "border-l-2 border-l-transparent hover:bg-zinc-800/25 hover:border-l-zinc-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 mt-1">
          <div className={`w-2 h-2 rounded-full shadow-sm ${statusColors[status] || "bg-zinc-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate leading-tight transition-colors ${active ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>{name}</p>
          <p className="text-zinc-500 text-xs mt-1 truncate">{location}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${scoreColor}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-zinc-600 text-xs shrink-0 tabular-nums">{time}</span>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({
  icon: Icon,
  text,
  time,
}: {
  icon: React.ElementType
  text: string
  time: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-900/40 transition-colors">
      <Icon className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-zinc-300 text-sm leading-relaxed">{text}</p>
        <p className="text-zinc-600 text-xs mt-1">{time}</p>
      </div>
    </div>
  )
}
