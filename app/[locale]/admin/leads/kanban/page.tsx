"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Users } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import {
  PageHeader,
  LoadingState,
  EmptyState,
} from "@/components/admin"
import { LeadsKanban } from "../_components/leads-kanban"
import type { Lead, LeadStatus } from "../_shared"

export default function LeadsKanbanPage() {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchLeads() {
      try {
        // Kanban shows every lead up front; no pagination.
        const res = await fetch("/api/leads?page=1&limit=200&sortBy=score&sortOrder=desc")
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        if (!cancelled) setLeads(data.leads)
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchLeads()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleStatusChange(leadId: string, nextStatus: LeadStatus) {
    // Optimistic update with rollback on failure
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
      setLeads(previous)
    }
  }

  function handleCardClick(leadId: string) {
    // Jump to the list view with the lead pre-selected via the search context
    router.push(`/admin/leads?focus=${leadId}`)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-6 shrink-0">
        <PageHeader
          variant="hero"
          title={t("pipeline")}
          description="Drag cards between columns to move leads through your pipeline."
          breadcrumbs={[{ label: t("allLeads"), href: "/admin/leads" }, { label: t("pipeline") }]}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Run a discovery job to start populating your pipeline."
        />
      ) : (
        <LeadsKanban
          leads={leads}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
        />
      )}
    </div>
  )
}
