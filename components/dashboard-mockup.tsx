"use client"

import type React from "react"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { ScoreLeadLogo } from "./scorelead-logo"

export function DashboardMockup() {
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
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div
      className="w-full h-full bg-zinc-950 flex overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sidebar */}
      <motion.div
        className="w-[220px] h-full bg-zinc-900/80 border-r border-zinc-800/50 flex flex-col shrink-0"
        variants={panelVariants}
      >
        {/* Logo */}
        <div className="p-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <ScoreLeadLogo className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">ScoreLead</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-auto" />
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800/50 rounded-md text-zinc-500 text-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Search leads...</span>
            <span className="ml-auto text-[10px] bg-zinc-700/50 px-1.5 py-0.5 rounded">⌘K</span>
          </div>
        </div>

        {/* Main nav */}
        <div className="px-3 space-y-0.5">
          <NavItem icon={Inbox} label="Inbox" badge={5} />
          <NavItem icon={Users} label="All Leads" active />
        </div>

        {/* Discovery section */}
        <div className="mt-5 px-3">
          <div className="px-2 py-1 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
            Discovery
          </div>
          <div className="space-y-0.5 mt-1">
            <NavItem icon={Radar} label="Discovery Jobs" hasSubmenu />
            <NavItem icon={Bookmark} label="Saved Searches" hasSubmenu />
          </div>
        </div>

        {/* Pipeline section */}
        <div className="mt-5 px-3">
          <div className="px-2 py-1 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
            Pipeline
          </div>
          <div className="space-y-0.5 mt-1">
            <NavItem icon={CircleDot} label="New" color="text-emerald-400" badge={142} />
            <NavItem icon={Send} label="Contacted" color="text-blue-400" />
            <NavItem icon={ThumbsUp} label="Interested" color="text-amber-400" />
            <NavItem icon={Trophy} label="Customers" color="text-emerald-400" />
          </div>
        </div>

        {/* Tools section */}
        <div className="mt-5 px-3 flex-1">
          <div className="px-2 py-1 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
            Tools
          </div>
          <div className="space-y-0.5 mt-1">
            <NavItem icon={Mail} label="Outreach" hasSubmenu />
            <NavItem icon={Download} label="Export" />
          </div>
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-zinc-800/50">
          <NavItem icon={Settings} label="Settings" />
        </div>
      </motion.div>

      {/* Lead List */}
      <motion.div
        className="w-[320px] h-full bg-zinc-900/40 border-r border-zinc-800/50 flex flex-col shrink-0"
        variants={panelVariants}
      >
        <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Leads</h3>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Score ↓</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide">
          <LeadItem
            name="Sunset Yoga Studio"
            location="San Francisco, CA"
            score={4.5}
            status="new"
            time="2h"
            active
          />
          <LeadItem
            name="Peak Fitness Co"
            location="Austin, TX"
            score={4.0}
            status="contacted"
            time="1d"
          />
          <LeadItem
            name="Bloom Wellness Spa"
            location="New York, NY"
            score={3.5}
            status="new"
            time="1d"
          />
          <LeadItem
            name="Iron Temple Gym"
            location="Chicago, IL"
            score={4.5}
            status="interested"
            time="3d"
          />
          <LeadItem
            name="Mindful Movement"
            location="Portland, OR"
            score={3.0}
            status="new"
            time="3d"
          />
          <LeadItem
            name="Urban Dance Academy"
            location="Miami, FL"
            score={2.5}
            status="contacted"
            time="5d"
          />
          <LeadItem
            name="Zen Garden Studio"
            location="Seattle, WA"
            score={4.0}
            status="new"
            time="1w"
          />
          <LeadItem
            name="CrossFit Downtown"
            location="Denver, CO"
            score={3.5}
            status="contacted"
            time="1w"
          />
        </div>
      </motion.div>

      {/* Detail Panel */}
      <motion.div className="flex-1 h-full bg-zinc-950 flex flex-col overflow-hidden" variants={panelVariants}>
        {/* Header breadcrumb */}
        <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500">Discovery</span>
            <span className="text-zinc-600">›</span>
            <span className="text-emerald-400">San Francisco</span>
            <span className="text-zinc-600">›</span>
            <span className="text-zinc-300">Sunset Yoga Studio</span>
          </div>
          <MoreHorizontal className="w-4 h-4 text-zinc-500" />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-auto scrollbar-hide">
          <div className="flex items-start justify-between mb-5">
            <h2 className="text-white text-xl font-semibold">Sunset Yoga Studio</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Score</span>
              <div className="flex items-center gap-1 bg-emerald-500/20 px-2.5 py-1 rounded-md">
                <span className="text-emerald-400 font-semibold text-lg">4.5</span>
                <span className="text-emerald-400/60 text-xs">/5</span>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="flex items-end gap-2 mb-6">
            {[
              { label: "Reach", value: 5, color: "bg-emerald-500" },
              { label: "Trust", value: 4, color: "bg-emerald-500" },
              { label: "Engage", value: 4, color: "bg-blue-500" },
              { label: "Match", value: 5, color: "bg-emerald-500" },
              { label: "Ready", value: 3, color: "bg-amber-500" },
            ].map((signal) => (
              <div key={signal.label} className="flex flex-col items-center gap-1">
                <div className="flex flex-col-reverse gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-5 h-1.5 rounded-sm ${i < signal.value ? signal.color : "bg-zinc-800"}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-zinc-500">{signal.label}</span>
              </div>
            ))}
          </div>

          {/* Enriched data */}
          <div className="bg-zinc-900/80 rounded-lg p-4 text-sm mb-5 border border-zinc-800/50 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-blue-400 text-xs">sunsetyoga.com</span>
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
              <span className="text-zinc-500 text-xs">(128 reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <AtSign className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-300 text-xs">@sunsetyogasf</span>
              <span className="text-zinc-500 text-xs">· 2.4k followers</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-zinc-500">Services:</span>
              <div className="flex gap-1">
                {["Yoga", "Pilates", "Meditation"].map((s) => (
                  <span key={s} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">Booking:</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                High opportunity
              </span>
            </div>
          </div>

          {/* Activity */}
          <div className="pt-4 border-t border-zinc-800/50">
            <div className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wider">Activity</div>
            <div className="space-y-3">
              <ActivityItem
                icon={Sparkles}
                text="AI enrichment completed - 14 data points extracted"
                time="2 hours ago"
                color="text-purple-400"
              />
              <ActivityItem
                icon={Mail}
                text="Outreach sequence generated - 3 steps, English"
                time="2 hours ago"
                color="text-blue-400"
              />
              <ActivityItem
                icon={Radar}
                text="Discovered via AI search - San Francisco, CA"
                time="2 hours ago"
                color="text-emerald-400"
              />
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
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
        active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
      }`}
    >
      <Icon className={`w-4 h-4 ${color || ""}`} />
      <span className="flex-1 text-xs">{label}</span>
      {badge && (
        <span className="bg-zinc-700/80 text-zinc-300 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-medium px-1">
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
}: {
  name: string
  location: string
  score: number
  status: string
  time: string
  active?: boolean
}) {
  const scoreColor =
    score >= 4 ? "text-emerald-400 bg-emerald-500/20" :
    score >= 3 ? "text-amber-400 bg-amber-500/20" :
    "text-red-400 bg-red-500/20"

  const statusColors: Record<string, string> = {
    new: "bg-emerald-500",
    contacted: "bg-blue-500",
    interested: "bg-amber-500",
    customer: "bg-emerald-400",
  }

  return (
    <div
      className={`px-4 py-3 border-b border-zinc-800/30 cursor-pointer transition-colors ${
        active ? "bg-zinc-800/50" : "hover:bg-zinc-800/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 mt-0.5">
          <div className={`w-2 h-2 rounded-full ${statusColors[status] || "bg-zinc-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs truncate leading-tight">{name}</p>
          <p className="text-zinc-500 text-[10px] mt-0.5 truncate">{location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreColor}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-zinc-600 text-[10px] shrink-0">{time}</span>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({
  icon: Icon,
  text,
  time,
  color,
}: {
  icon: React.ElementType
  text: string
  time: string
  color: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-4 h-4 ${color} mt-0.5`} />
      <div className="flex-1">
        <p className="text-zinc-400 text-xs">{text}</p>
        <p className="text-zinc-600 text-[10px] mt-0.5">{time}</p>
      </div>
    </div>
  )
}
