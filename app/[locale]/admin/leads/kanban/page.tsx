"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Users } from "lucide-react"
import {
  PageHeader,
  LoadingState,
  EmptyState,
} from "@/components/admin"
import { LeadDetailModal } from "@/components/admin/lead-detail-modal"
import { useActiveBusiness } from "@/components/admin/active-business-context"
import { LeadsKanban } from "../_components/leads-kanban"
import type { Lead, LeadStatus } from "../_shared"

export default function LeadsKanbanPage() {
  const t = useTranslations("dashboard")
  const { activeBusinessId } = useActiveBusiness()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null

  useEffect(() => {
    const controller = new AbortController()
    async function fetchLeads() {
      setLoading(true)
      try {
        const res = await fetch(
          "/api/leads?page=1&limit=200&sortBy=score&sortOrder=desc",
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        if (!controller.signal.aborted) setLeads(data.leads)
      } catch (err) {
        if ((err as Error).name === "AbortError") return
      }
      if (!controller.signal.aborted) setLoading(false)
    }
    fetchLeads()
    return () => controller.abort()
  }, [activeBusinessId])

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
    setSelectedLeadId(leadId)
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

      <LeadDetailModal
        lead={selectedLead}
        open={selectedLeadId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null)
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
