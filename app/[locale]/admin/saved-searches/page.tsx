"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { MapPin, Bookmark, ChevronRight, Loader2, Trash2, Play } from "lucide-react"
import { Link } from "@/i18n/routing"
import { toast } from "sonner"
import {
  PageHeader,
  ContentWrapper,
  LoadingState,
  EmptyState,
} from "@/components/admin"
import { formatRelativeDate } from "@/lib/admin-utils"

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
    fetch("/api/discovery/saved-searches")
      .then((r) => r.ok ? r.json() : [])
      .then(setSearches)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/discovery/saved-searches/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== id))
        toast.success("Search deleted")
      }
    } catch {
      toast.error("Failed to delete")
    }
    setDeleting(null)
  }

  return (
    <div className="flex-1 overflow-auto">
      <ContentWrapper>
        <PageHeader
          variant="hero"
          title={t("savedSearches")}
          description="Reuse your search configurations to quickly launch new discovery jobs."
          breadcrumbs={[{ label: t("discovery") }]}
          actions={
            <Link
              href="/admin/discovery-jobs/new"
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm flex items-center gap-2"
            >
              {t("createJob")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        />

        {loading ? (
          <LoadingState />
        ) : searches.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved searches yet"
            description="Save a search from the create job form to reuse it later."
          />
        ) : (
          <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_120px_80px] px-6 h-11 items-center text-xs text-zinc-500 font-medium uppercase tracking-wider bg-zinc-900/30 border-b border-zinc-800/60">
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
                <div className="min-w-0">
                  <p className="text-zinc-200 text-sm truncate">{search.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {search.keywords.slice(0, 3).map((kw) => (
                      <span key={kw} className="text-[11px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded">{kw}</span>
                    ))}
                    {search.keywords.length > 3 && (
                      <span className="text-[11px] text-zinc-600">+{search.keywords.length - 3}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="truncate">{search.location}</span>
                </div>

                <p className="text-zinc-600 text-sm text-right">{formatRelativeDate(search.createdAt)}</p>

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
      </ContentWrapper>
    </div>
  )
}
