"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  MapPin,
  Bookmark,
  ChevronRight,
  Loader2,
  Trash2,
  Play,
} from "lucide-react"
import { MobileMenuButton } from "@/components/admin-shell"
import { Link } from "@/i18n/routing"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface SavedSearch {
  id: string
  name: string
  country: string
  state: string | null
  city: string | null
  location: string
  keywords: string[]
  createdAt: string
}

export default function SavedSearchesPage() {
  const t = useTranslations("dashboard")
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSearches() {
      try {
        const res = await fetch("/api/discovery/saved-searches")
        if (res.ok) {
          setSearches(await res.json())
        }
      } catch {
        // Failed to fetch
      }
      setLoading(false)
    }
    fetchSearches()
  }, [])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/discovery/saved-searches/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== id))
        toast.success("Search deleted")
      }
    } catch {
      toast.error("Failed to delete")
    }
    setDeleting(null)
  }

  function formatDate(dateStr: string): string {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Page header */}
      <div className="relative">
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-20%",
            left: "30%",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative px-8 pt-10 pb-8 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <MobileMenuButton />
          </div>

          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-400 text-sm">{t("discovery")}</span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
              <h1
                className="text-3xl md:text-4xl text-white mb-3"
                style={{
                  letterSpacing: "-0.0325em",
                  fontWeight: 500,
                  lineHeight: 1.1,
                }}
              >
                {t("savedSearches")}
              </h1>
              <p className="text-zinc-400 max-w-lg leading-relaxed">
                Reuse your search configurations to quickly launch new discovery jobs.
              </p>
            </div>

            <Link
              href="/admin/discovery-jobs/new"
              className="shrink-0 px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm flex items-center gap-2"
            >
              {t("createJob")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-8 pb-10 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : searches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="w-8 h-8 text-zinc-700 mb-4" />
            <p className="text-zinc-400 text-sm mb-2">No saved searches yet</p>
            <p className="text-zinc-600 text-sm">Save a search from the create job form to reuse it later.</p>
          </div>
        ) : (
          <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_180px_120px_80px] px-6 h-11 items-center text-xs text-zinc-500 bg-zinc-900/30 border-b border-zinc-800/60">
              <span>Name</span>
              <span>Location</span>
              <span className="text-right">Created</span>
              <span />
            </div>

            {searches.map((search, index) => (
              <div
                key={search.id}
                className={`grid grid-cols-[1fr_180px_120px_80px] px-6 py-4 items-center hover:bg-zinc-900/40 transition-colors group ${
                  index < searches.length - 1 ? "border-b border-zinc-800/40" : ""
                }`}
              >
                {/* Name + keywords */}
                <div className="min-w-0">
                  <p className="text-zinc-200 text-sm truncate">{search.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {search.keywords.slice(0, 3).map((kw) => (
                      <span key={kw} className="text-[11px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                    {search.keywords.length > 3 && (
                      <span className="text-[11px] text-zinc-600">+{search.keywords.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="truncate">{search.location}</span>
                </div>

                {/* Created */}
                <p className="text-zinc-600 text-sm text-right">{formatDate(search.createdAt)}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/discovery-jobs/new?savedSearchId=${search.id}`}
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Run this search"
                  >
                    <Play className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(search.id)}
                    disabled={deleting === search.id}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deleting === search.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
