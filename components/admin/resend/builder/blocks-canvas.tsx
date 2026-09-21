"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import type { EmailBlock, EmailComponentKind, EmailComponentSet, EmailDocument } from "@/lib/resend/blocks"
import { resolveComponents, substituteComponentProps } from "@/lib/resend/blocks"
import type { EmailContext } from "@/lib/resend/render"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import { EMAIL_CARD_WIDTH } from "@/lib/emails/blocks/blocks-content"
import { renderBlock } from "@/lib/emails/blocks/block-renderer"
import { BrandFontLink } from "@/components/admin/resend/brand-font-link"
import { BlockShell } from "./block-shell"
import { SharedBlock } from "./shared-block"
import { AiMark } from "@/components/admin/resend/ai-mark"

export function BlocksCanvas({
  doc,
  components,
  theme,
  selectedId,
  readOnly,
  onSelect,
  onUpdateBlock,
  onReorder,
  onMove,
  onDuplicate,
  onRemove,
  onToggleShared,
  onEditShared,
  onGenerate,
  previewContext,
}: {
  doc: EmailDocument
  components: EmailComponentSet
  theme: BrandTheme
  selectedId: string | null
  readOnly: boolean
  onSelect: (id: string | null) => void
  onUpdateBlock: (block: EmailBlock) => void
  onReorder: (from: number, to: number) => void
  onMove: (id: string, delta: -1 | 1) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onToggleShared: (kind: EmailComponentKind, enabled: boolean) => void
  onEditShared: (kind: EmailComponentKind) => void
  onGenerate?: () => void
  previewContext?: EmailContext
}) {
  const t = useTranslations("resend")
  const resolvedRaw = resolveComponents(components)
  const resolved = previewContext ? substituteComponentProps(resolvedRaw, previewContext) : resolvedRaw
  const [activeId, setActiveId] = useState<string | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useEffect(() => setPortalTarget(document.body), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = doc.blocks.findIndex((b) => b.id === active.id)
    const to = doc.blocks.findIndex((b) => b.id === over.id)
    if (from >= 0 && to >= 0) onReorder(from, to)
  }

  const activeBlock = activeId ? doc.blocks.find((b) => b.id === activeId) : null
  const sharedProps = (kind: EmailComponentKind) => ({
    kind,
    enabled: doc.shared[kind],
    customized: components[kind] !== null,
    components: resolved,
    theme,
    readOnly,
    onToggle: (enabled: boolean) => onToggleShared(kind, enabled),
    onEdit: () => onEditShared(kind),
  })

  return (
    <div className="rounded-2xl p-4 sm:p-6" style={{ backgroundColor: theme.background }} onClick={() => onSelect(null)}>
      <BrandFontLink theme={theme} />
      <div
        className="mx-auto w-full rounded-xl bg-white px-8 py-7 text-[#18181b] shadow-sm sm:px-10 sm:py-8"
        style={{ maxWidth: EMAIL_CARD_WIDTH, fontFamily: theme.fontStack, border: `1px solid ${theme.accentSoft}`, borderTop: `4px solid ${theme.primary}` }}
      >
        <SharedBlock {...sharedProps("header")} />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <SortableContext items={doc.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="my-2 space-y-1">
              {doc.blocks.length === 0 ? (
                <div className="my-4 rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-medium text-zinc-700">{t("builderEmptyTitle")}</p>
                  <p className="mt-1 text-sm text-zinc-500">{t("builderEmptyBody")}</p>
                  {onGenerate && !readOnly && (
                    <Button type="button" variant="outline" size="sm" className="mt-4 gap-1.5 border-emerald-500/30 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-white dark:hover:bg-emerald-50" onClick={onGenerate}>
                      <AiMark size={14} />
                      {t("aiButton")}
                    </Button>
                  )}
                </div>
              ) : (
                doc.blocks.map((block, index) => (
                  <BlockShell
                    key={block.id}
                    block={block}
                    index={index}
                    count={doc.blocks.length}
                    selected={selectedId === block.id}
                    readOnly={readOnly}
                    theme={theme}
                    onSelect={() => onSelect(block.id)}
                    onUpdate={onUpdateBlock}
                    onMove={(delta) => onMove(block.id, delta)}
                    onDuplicate={() => onDuplicate(block.id)}
                    onRemove={() => onRemove(block.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
          {portalTarget &&
            createPortal(
              <DragOverlay zIndex={80} dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
                {activeBlock ? (
                  <div className="rounded-lg bg-white px-4 py-2 shadow-2xl ring-1 ring-black/10" style={{ width: EMAIL_CARD_WIDTH - 80, fontFamily: theme.fontStack, color: theme.text }}>
                    {renderBlock(activeBlock, theme)}
                  </div>
                ) : null}
              </DragOverlay>,
              portalTarget,
            )}
        </DndContext>

        <SharedBlock {...sharedProps("footer")} />
      </div>
    </div>
  )
}
