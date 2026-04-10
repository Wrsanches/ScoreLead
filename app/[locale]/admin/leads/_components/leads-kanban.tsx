"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Mail, Phone, Globe, MapPin, Bot, GripVertical } from "lucide-react"
import {
  LEAD_STATUS_KEYS,
  STATUS_CONFIG,
  type Lead,
  type LeadStatus,
} from "../_shared"
import { StatNumber } from "@/components/admin"
import { getInitials, scoreBadgeClasses } from "@/lib/admin-utils"

interface LeadsKanbanProps {
  leads: Lead[]
  onStatusChange: (leadId: string, status: LeadStatus) => void
  onCardClick?: (leadId: string) => void
}

export function LeadsKanban({ leads, onStatusChange, onCardClick }: LeadsKanbanProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  // PointerSensor with activation distance — a small drag distance (6px) is
  // required before drag starts, so plain clicks still fire onClick normally.
  // KeyboardSensor provides full a11y support for keyboard users.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  )

  // Group leads by status. Unknown statuses fall into "new".
  const grouped = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      interested: [],
      no_profile: [],
      not_interested: [],
      customer: [],
    }
    for (const lead of leads) {
      const key = (LEAD_STATUS_KEYS as readonly string[]).includes(lead.status)
        ? (lead.status as LeadStatus)
        : "new"
      map[key].push(lead)
    }
    return map
  }, [leads])

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    const lead = leads.find((l) => l.id === id)
    setActiveLead(lead || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveLead(null)
    if (!over) return
    const leadId = active.id as string
    const newStatus = over.id as LeadStatus
    if (!(LEAD_STATUS_KEYS as readonly string[]).includes(newStatus)) return
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return
    onStatusChange(leadId, newStatus)
  }

  function handleDragCancel() {
    setActiveLead(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex-1 h-full overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full min-w-max px-4 py-4">
          {LEAD_STATUS_KEYS.map((key) => (
            <KanbanColumn
              key={key}
              status={key}
              items={grouped[key]}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>

      {/* Floating preview of the dragging card */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeLead ? <KanbanCardPreview lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── Column ──────────────────────────────────────────────

function KanbanColumn({
  status,
  items,
  onCardClick,
}: {
  status: LeadStatus
  items: Lead[]
  onCardClick?: (leadId: string) => void
}) {
  const cfg = STATUS_CONFIG[status]
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[280px] shrink-0 rounded-xl border transition-all duration-150 ${
        isOver
          ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-[0_0_32px_-8px_rgba(16,185,129,0.3)]"
          : "border-zinc-800/70 bg-zinc-900/30"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3.5 py-3 border-b border-zinc-800/60 shrink-0">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">{cfg.label}</h3>
        <StatNumber
          value={items.length}
          className="ml-auto text-xs text-zinc-500 bg-zinc-800/60 rounded-md px-1.5 py-0.5 min-w-[24px] text-center"
        />
      </div>

      {/* Column body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-xs text-zinc-700 border border-dashed border-zinc-800/60 rounded-lg">
            {isOver ? "Drop here" : "Empty"}
          </div>
        ) : (
          items.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onCardClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Draggable card ──────────────────────────────────────

function KanbanCard({
  lead,
  onCardClick,
}: {
  lead: Lead
  onCardClick?: (leadId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging) onCardClick?.(lead.id)
      }}
      className="group relative cursor-grab active:cursor-grabbing select-none rounded-lg border border-zinc-800/70 bg-zinc-900/60 p-2.5 hover:border-zinc-700 hover:bg-zinc-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      {/* Drag handle glyph shown on hover */}
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical className="w-3 h-3 text-zinc-600" />
      </div>
      <CardContent lead={lead} />
    </div>
  )
}

// ── Drag overlay preview (non-interactive) ──────────────

function KanbanCardPreview({ lead }: { lead: Lead }) {
  return (
    <div className="w-[260px] cursor-grabbing rounded-lg border border-emerald-500/40 bg-zinc-900 p-2.5 shadow-2xl shadow-emerald-500/20 ring-1 ring-emerald-500/20 rotate-[2deg]">
      <CardContent lead={lead} />
    </div>
  )
}

// ── Shared card body ────────────────────────────────────

function CardContent({ lead }: { lead: Lead }) {
  const location = [lead.city, lead.state, lead.country].filter(Boolean).join(", ")

  return (
    <div className="flex items-start gap-2.5">
      {lead.photoUrl ? (
        <img
          src={lead.photoUrl}
          alt=""
          className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-zinc-800"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 ring-1 ring-zinc-700/50">
          <span className="text-[10px] font-medium text-zinc-400">
            {getInitials(lead.name)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-zinc-100 truncate leading-tight">
            {lead.name || "Unknown"}
          </p>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums shrink-0 ${scoreBadgeClasses(
              lead.score,
            )}`}
          >
            {lead.score.toFixed(1)}
          </span>
        </div>

        {location && (
          <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
            {location}
          </p>
        )}

        <div className="flex items-center gap-1 mt-1.5">
          {lead.website && <ContactDot icon={Globe} title="Has website" />}
          {lead.email && <ContactDot icon={Mail} title={`Email: ${lead.email}`} />}
          {lead.phone && <ContactDot icon={Phone} title={`Phone: ${lead.phone}`} />}
          {lead.firecrawlEnriched && (
            <ContactDot icon={Bot} title="AI enriched" variant="violet" />
          )}
        </div>
      </div>
    </div>
  )
}

function ContactDot({
  icon: Icon,
  title,
  variant = "zinc",
}: {
  icon: React.ElementType
  title: string
  variant?: "zinc" | "violet"
}) {
  const color = variant === "violet" ? "text-violet-400" : "text-zinc-500"
  return (
    <div
      title={title}
      className={`w-5 h-5 rounded-md bg-zinc-800/70 flex items-center justify-center ${color}`}
    >
      <Icon className="w-2.5 h-2.5" />
    </div>
  )
}
