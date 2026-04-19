"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  Mail,
  Phone,
  Globe,
  AtSign,
  MapPin,
  Star,
  ExternalLink,
  Check,
  ChevronDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "@/i18n/routing"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { getInitials, scoreColor, scoreBadgeClasses } from "@/lib/admin-utils"
import {
  LEAD_STATUS_KEYS,
  STATUS_CONFIG,
  getStatus,
  type Lead,
  type LeadStatus,
} from "@/app/[locale]/admin/leads/_shared"

interface LeadDetailModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (leadId: string, next: LeadStatus) => void
}

const SCORE_CATEGORIES = [
  { key: "reach", label: "reach", color: "from-emerald-500 to-emerald-400", empty: "bg-emerald-500/[0.06]", text: "text-emerald-400" },
  { key: "trust", label: "trust", color: "from-sky-500 to-sky-400", empty: "bg-sky-500/[0.06]", text: "text-sky-400" },
  { key: "offer", label: "engage", color: "from-violet-500 to-violet-400", empty: "bg-violet-500/[0.06]", text: "text-violet-400" },
  { key: "profile", label: "match", color: "from-amber-500 to-amber-400", empty: "bg-amber-500/[0.06]", text: "text-amber-400" },
  { key: "social", label: "ready", color: "from-rose-500 to-rose-400", empty: "bg-rose-500/[0.06]", text: "text-rose-400" },
] as const

export function LeadDetailModal({
  lead,
  open,
  onOpenChange,
  onStatusChange,
}: LeadDetailModalProps) {
  const t = useTranslations("dashboard")

  if (!lead) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800" />
      </Dialog>
    )
  }

  const status = getStatus(lead.status)
  const location =
    [lead.city, lead.state, lead.country].filter(Boolean).join(", ") ||
    lead.address ||
    ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-zinc-950 border-zinc-800 p-0 flex flex-col">
        <VisuallyHidden.Root>
          <DialogTitle>{lead.name || "Lead detail"}</DialogTitle>
          <DialogDescription>
            {location || "Lead details"}
          </DialogDescription>
        </VisuallyHidden.Root>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-zinc-800/70">
          <div className="flex items-start gap-4">
            {lead.photoUrl ? (
              <span className="relative w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-zinc-700/80 shadow-lg shadow-black/30 shrink-0 block">
                <Image
                  src={lead.photoUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              </span>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 ring-1 ring-zinc-700/60">
                <span className="text-xl font-semibold text-zinc-400">
                  {getInitials(lead.name)}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.bg} ${status.text} ring-1 ${status.ring} hover:brightness-110 transition`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {LEAD_STATUS_KEYS.map((key) => {
                      const cfg = STATUS_CONFIG[key]
                      const isCurrent = key === lead.status
                      return (
                        <DropdownMenuItem
                          key={key}
                          disabled={isCurrent}
                          onClick={() => onStatusChange(lead.id, key)}
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          <span className="flex-1 text-sm">{cfg.label}</span>
                          {isCurrent && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span
                  className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${scoreBadgeClasses(lead.score)}`}
                >
                  {lead.score.toFixed(1)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight line-clamp-2">
                {lead.name || "Unknown"}
              </h2>
              {location && (
                <p className="text-zinc-400 text-sm mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
              )}
              {lead.googleRating != null && (
                <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-zinc-200 font-medium tabular-nums">
                    {lead.googleRating.toFixed(1)}
                  </span>
                  {lead.googleReviewCount != null && (
                    <span className="text-zinc-600">
                      ({lead.googleReviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {lead.aiSummary && (
            <p className="text-sm text-zinc-300 leading-relaxed">
              {lead.aiSummary}
            </p>
          )}

          {/* Score breakdown */}
          {lead.scoreBreakdown?.categories && (
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Score breakdown
                </p>
                <span
                  className={`text-xs font-semibold tabular-nums ${scoreColor(lead.score)}`}
                >
                  {lead.score.toFixed(1)}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {SCORE_CATEGORIES.map((cat) => {
                  const value =
                    lead.scoreBreakdown?.categories[cat.key] ?? 0
                  const hasValue = value > 0
                  return (
                    <div
                      key={cat.key}
                      className="flex flex-col items-center gap-1.5 min-w-0"
                    >
                      <span
                        className={`text-xs font-semibold tabular-nums ${hasValue ? cat.text : "text-zinc-500"}`}
                      >
                        {value.toFixed(0)}/5
                      </span>
                      <div className="flex flex-col-reverse gap-0.75 w-full max-w-10">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-full h-2 rounded-sm ${
                              i < value
                                ? `bg-gradient-to-t ${cat.color}`
                                : cat.empty
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium truncate max-w-full">
                        {cat.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">
              Contact
            </p>
            {lead.website && (
              <ContactRow icon={Globe} label={lead.websiteDomain || lead.website} href={lead.website} external />
            )}
            {lead.email && (
              <ContactRow icon={Mail} label={lead.email} href={`mailto:${lead.email}`} />
            )}
            {lead.phone && (
              <ContactRow icon={Phone} label={lead.phone} href={`tel:${lead.phone}`} />
            )}
            {lead.instagramHandle && (
              <ContactRow
                icon={AtSign}
                label={`@${lead.instagramHandle.replace(/^@/, "")}`}
                href={`https://instagram.com/${lead.instagramHandle.replace(/^@/, "")}`}
                external
              />
            )}
            {!lead.website && !lead.email && !lead.phone && !lead.instagramHandle && (
              <p className="text-xs text-zinc-600 italic">No contact info.</p>
            )}
          </div>

          {/* Services */}
          {lead.services && lead.services.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                {t("services")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lead.services.slice(0, 10).map((s) => (
                  <span
                    key={s}
                    className="text-[11px] text-zinc-300 bg-zinc-800/60 border border-zinc-800 px-2 py-0.5 rounded-md"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lead.description && (
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                About
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-6">
                {lead.description}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600 capitalize">
            {lead.source.replace("_", " ")}
            {lead.firecrawlEnriched && (
              <span className="ml-2 text-zinc-400">• enriched</span>
            )}
          </span>
          <Link
            href={`/admin/leads?focus=${lead.id}`}
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            Open full lead
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ContactRow({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: React.ElementType
  label: string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40 transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <span className="flex-1 text-sm text-zinc-300 truncate">{label}</span>
      {external && (
        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
      )}
    </a>
  )
}
