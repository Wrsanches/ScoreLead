"use client"

import type React from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Columns3,
  CalendarDays,
  Building2,
  Puzzle,
  Radar,
  ChevronDown,
  ChevronRight,
  Search,
  MoreHorizontal,
  Sparkles,
  Mail,
  Globe,
  Phone,
  Star,
  AtSign,
  Zap,
} from "lucide-react"
import { ScoreLeadLogo } from "./scorelead-logo"

/**
 * Marketing mock of the admin. Mirrors the real shell: an ambient canvas, a
 * floating glass sidebar, and translucent panes. It renders inside a scaled,
 * 3D-transformed frame, so it uses the blur-free glass-card surface only -
 * backdrop-filter inside a transformed subtree is costly and unreliable.
 */
export function DashboardPreview() {
  const t = useTranslations("dashboard")
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.5,
      },
    },
  }

  const panelVariants = {
    hidden: {
      opacity: 0,
      x: 100,
      y: -80,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <motion.div
      className="dark relative w-full h-full flex overflow-hidden"
      style={{
        backgroundColor: "#09090b",
        backgroundImage: `
          radial-gradient(ellipse 55% 45% at 8% 0%, rgba(16,185,129,0.22), transparent 62%),
          radial-gradient(ellipse 50% 55% at 100% 100%, rgba(6,182,212,0.13), transparent 60%),
          radial-gradient(ellipse 35% 30% at 70% 15%, rgba(99,102,241,0.12), transparent 60%)
        `,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating glass sidebar */}
      <motion.aside
        className="glass-card my-4 ml-4 w-60 rounded-3xl flex flex-col shrink-0"
        variants={panelVariants}
      >
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ScoreLeadLogo className="w-6 h-6 text-white" />
            <span className="text-white font-semibold text-[15px] tracking-tight">ScoreLead</span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <div className="glass-pill flex items-center gap-2.5 px-2.5 py-2 rounded-xl">
            <span className="w-6 h-6 rounded-md bg-white/[0.07] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            </span>
            <span className="flex-1 text-sm text-zinc-200 truncate">Sunset Wellness Co.</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-500 text-sm ring-1 ring-inset ring-white/[0.06]">
            <Search className="w-4 h-4" />
            <span>{t("searchLeads")}</span>
            <span className="ml-auto text-xs bg-white/[0.07] text-zinc-400 px-1.5 py-0.5 rounded-md font-medium">⌘K</span>
          </div>
        </div>

        <div className="px-3 space-y-0.5">
          <NavItem icon={LayoutDashboard} label={t("dashboard")} />
          <NavItem icon={Users} label={t("allLeads")} active />
          <NavItem icon={Columns3} label={t("pipeline")} />
          <NavItem icon={CalendarDays} label={t("contentCalendar")} />
          <NavItem icon={Building2} label={t("businessPage")} />
          <NavItem icon={Puzzle} label={t("integrations")} />
        </div>

        <div className="mt-auto p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/[0.08] px-3 py-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(16,185,129,0.25)]">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-emerald-300 truncate">Upgrade</span>
              <span className="block text-[11px] text-emerald-400/60 truncate">Find, score and write - one plan</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2">
            <span className="w-7 h-7 rounded-full bg-linear-to-br from-zinc-600 to-zinc-700 flex items-center justify-center ring-1 ring-zinc-600/50">
              <span className="text-xs font-medium text-zinc-300">MR</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-zinc-200 truncate">Maya Rivera</span>
              <span className="block text-xs text-zinc-500 truncate">maya@sunsetwellness.co</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>
        </div>
      </motion.aside>

      {/* Leads list pane */}
      <motion.div
        className="ml-3 w-85 h-full bg-white/[0.03] border-r border-white/[0.08] flex flex-col shrink-0"
        variants={panelVariants}
      >
        <div className="px-4 h-18 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg tracking-tight">{t("leads")}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              <span className="text-zinc-400">142</span> {t("leads").toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-zinc-400 bg-white/[0.07] px-2.5 py-1.5 rounded-lg border border-white/[0.08]">
            <span className="text-zinc-200">{t("score")}</span>
            <span aria-hidden="true" className="text-zinc-500">↓</span>
          </div>
        </div>

        <div className="px-3 pt-3 pb-4 shrink-0">
          <div className="glass-card flex items-center gap-3 rounded-2xl px-3.5 py-3 ring-1 ring-emerald-500/25">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Radar className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-white">{t("discoveryCta")}</span>
              <span className="block text-xs text-zinc-500 truncate">{t("discoveryCtaHint")}</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-zinc-400" />
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide">
          <LeadItem name={t("lead1")} location={t("lead1Location")} score={4.5} status="new" time="2h" active />
          <LeadItem name={t("lead2")} location={t("lead2Location")} score={4.0} status="contacted" time="1d" />
          <LeadItem name={t("lead3")} location={t("lead3Location")} score={3.5} status="new" time="1d" />
          <LeadItem name={t("lead4")} location={t("lead4Location")} score={4.5} status="interested" time="3d" />
          <LeadItem name={t("lead5")} location={t("lead5Location")} score={3.0} status="new" time="3d" />
          <LeadItem name={t("lead6")} location={t("lead6Location")} score={2.5} status="contacted" time="5d" />
          <LeadItem name={t("lead7")} location={t("lead7Location")} score={4.0} status="new" time="1w" />
          <LeadItem name={t("lead8")} location={t("lead8Location")} score={3.5} status="contacted" time="1w" />
        </div>
      </motion.div>

      {/* Lead detail pane */}
      <motion.div className="flex-1 h-full flex flex-col overflow-hidden" variants={panelVariants}>
        <div className="px-5 h-18 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-zinc-500">{t("discovery")}</span>
            <span className="text-zinc-700">/</span>
            <span className="text-emerald-400">San Francisco</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-300">{t("lead1")}</span>
          </div>
          <MoreHorizontal className="w-4 h-4 text-zinc-500" />
        </div>

        <div className="flex-1 p-6 overflow-auto scrollbar-hide">
          <div className="glass-card rounded-2xl p-5 mb-5">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-white/[0.07] flex items-center justify-center ring-1 ring-white/[0.1] text-lg font-semibold text-zinc-200">
                  SY
                </span>
                <div>
                  <h2 className="text-white text-xl font-semibold tracking-tight">{t("lead1")}</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">{t("lead1Location")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">{t("score")}</span>
                <div className="flex items-center gap-1 bg-emerald-500/15 ring-1 ring-emerald-500/25 px-2.5 py-1 rounded-lg">
                  <span className="text-emerald-400 font-semibold text-lg">4.5</span>
                  <span className="text-emerald-400/60 text-xs">/5</span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3">
              {[
                { label: t("reach"), value: 5, color: "bg-emerald-500" },
                { label: t("trust"), value: 4, color: "bg-emerald-500" },
                { label: t("engage"), value: 4, color: "bg-sky-500" },
                { label: t("match"), value: 5, color: "bg-emerald-500" },
                { label: t("ready"), value: 3, color: "bg-amber-500" },
              ].map((signal) => (
                <div key={signal.label} className="flex flex-col items-center gap-1">
                  <div className="flex flex-col-reverse gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-1.5 rounded-sm ${i < signal.value ? signal.color : "bg-white/[0.07]"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500">{signal.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_16rem] gap-5">
            <div className="glass-card rounded-2xl p-5 text-sm space-y-3">
              <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Contact</p>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-sky-400 text-xs">sunsetyoga.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-300 text-xs">hello@sunsetyoga.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-300 text-xs">(415) 555-0142</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-300 text-xs">4.7</span>
                <span className="text-zinc-500 text-xs">(128 {t("reviews")})</span>
              </div>
              <div className="flex items-center gap-2">
                <AtSign className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-300 text-xs">@sunsetyogasf</span>
                <span className="text-zinc-500 text-xs">· 2.4k {t("followers")}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-zinc-500">{t("services")}</span>
                <div className="flex gap-1">
                  {[t("serviceYoga"), t("servicePilates"), t("serviceMeditation")].map((s) => (
                    <span key={s} className="text-[10px] bg-white/[0.07] text-zinc-400 px-1.5 py-0.5 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">{t("booking")}</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25 px-1.5 py-0.5 rounded-md">
                  {t("highOpportunity")}
                </span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-4">{t("activity")}</p>
              <div className="space-y-4">
                <ActivityItem icon={Sparkles} text={t("enrichmentCompleted")} time={t("hoursAgo")} accent="violet" />
                <ActivityItem icon={Mail} text={t("outreachGenerated")} time={t("hoursAgo")} accent="sky" />
                <ActivityItem icon={Radar} text={t("discoveredVia")} time={t("hoursAgo")} accent="emerald" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
}) {
  return (
    <div
      role="presentation"
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${
        active ? "glass-pill text-white" : "text-zinc-400"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-zinc-500"}`} />
      <span className="flex-1 text-sm">{label}</span>
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
}: {
  name: string
  location: string
  score: number
  status: string
  time: string
  active?: boolean
}) {
  const scoreColor =
    score >= 4 ? "text-emerald-400 bg-emerald-500/15" :
    score >= 3 ? "text-amber-400 bg-amber-500/15" :
    "text-red-400 bg-red-500/15"

  const statusColors: Record<string, string> = {
    new: "bg-emerald-500",
    contacted: "bg-sky-500",
    interested: "bg-amber-500",
    customer: "bg-emerald-400",
  }

  return (
    <div
      role="presentation"
      className={`px-4 py-3 border-l-[3px] ${
        active ? "border-l-emerald-500 bg-white/[0.05]" : "border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-[11px] font-medium text-zinc-300">
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${statusColors[status] || "bg-zinc-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate leading-tight">{name}</p>
          <p className="text-zinc-500 text-xs mt-0.5 truncate">{location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${scoreColor}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-zinc-600 text-xs shrink-0">{time}</span>
        </div>
      </div>
    </div>
  )
}

const ACTIVITY_ACCENTS = {
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  sky:     { icon: "text-sky-400",     bg: "bg-sky-500/10",     ring: "ring-sky-500/20" },
  violet:  { icon: "text-violet-400",  bg: "bg-violet-500/10",  ring: "ring-violet-500/20" },
} as const

function ActivityItem({
  icon: Icon,
  text,
  time,
  accent,
}: {
  icon: React.ElementType
  text: string
  time: string
  accent: keyof typeof ACTIVITY_ACCENTS
}) {
  const c = ACTIVITY_ACCENTS[accent]
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ring-1 ${c.bg} ${c.ring}`}>
        <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-zinc-300 text-sm leading-snug">{text}</p>
        <p className="text-zinc-600 text-xs mt-0.5">{time}</p>
      </div>
    </div>
  )
}
