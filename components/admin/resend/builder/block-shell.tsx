"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useTranslations } from "next-intl"
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from "lucide-react"
import type { EmailBlock } from "@/lib/resend/blocks"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import { renderBlock } from "@/lib/emails/blocks/block-renderer"
import { InlineRichEditor } from "./inline-rich-editor"
import { InlineHeadingEditor } from "./inline-heading-editor"

/**
 * Sortable wrapper around one block. The drag listeners live on the handle
 * only, so clicking into an inline editor never starts a drag.
 */
export function BlockShell({
  block,
  index,
  count,
  selected,
  readOnly,
  theme,
  onSelect,
  onUpdate,
  onMove,
  onDuplicate,
  onRemove,
}: {
  block: EmailBlock
  index: number
  count: number
  selected: boolean
  readOnly: boolean
  theme: BrandTheme
  onSelect: () => void
  onUpdate: (block: EmailBlock) => void
  onMove: (delta: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const t = useTranslations("resend")
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: readOnly,
  })

  const editing = selected && !readOnly && (block.type === "text" || block.type === "heading")
  const incomplete =
    (block.type === "heading" && !block.props.text.trim()) ||
    (block.type === "button" && (!block.props.label.trim() || !block.props.href)) ||
    (block.type === "image" && !block.props.src)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      className={`group relative -mx-3 rounded-lg px-3 py-1 transition-shadow ${
        selected ? "ring-1 ring-zinc-900/70" : "hover:ring-1 hover:ring-zinc-300"
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      data-block-id={block.id}
    >
      {!readOnly && (
        <div
          className={`absolute -right-2 top-1 z-20 flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-zinc-900 p-0.5 text-zinc-300 shadow-md transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} className="flex size-7 cursor-grab items-center justify-center rounded-md text-zinc-300 hover:bg-white/[0.1] hover:text-white active:cursor-grabbing" aria-label={t("blockDragHandle")}>
            <GripVertical className="size-3.5" />
          </button>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="flex size-7 items-center justify-center rounded-md text-zinc-300 hover:bg-white/[0.1] hover:text-white disabled:text-zinc-600 disabled:hover:bg-transparent" aria-label={t("blockMoveUp")}><ArrowUp className="size-3.5" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className="flex size-7 items-center justify-center rounded-md text-zinc-300 hover:bg-white/[0.1] hover:text-white disabled:text-zinc-600 disabled:hover:bg-transparent" aria-label={t("blockMoveDown")}><ArrowDown className="size-3.5" /></button>
          <button type="button" onClick={onDuplicate} className="flex size-7 items-center justify-center rounded-md text-zinc-300 hover:bg-white/[0.1] hover:text-white" aria-label={t("blockDuplicate")}><Copy className="size-3.5" /></button>
          <button type="button" onClick={onRemove} className="flex size-7 items-center justify-center rounded-md text-zinc-300 hover:bg-red-500/15 hover:text-red-300" aria-label={t("blockDelete")}><Trash2 className="size-3.5" /></button>
        </div>
      )}

      {editing && block.type === "text" ? (
        <InlineRichEditor doc={block.props.doc} align={block.props.align} theme={theme} onChange={(doc) => onUpdate({ ...block, props: { ...block.props, doc } })} />
      ) : editing && block.type === "heading" ? (
        <InlineHeadingEditor text={block.props.text} level={block.props.level} align={block.props.align} theme={theme} onChange={(text) => onUpdate({ ...block, props: { ...block.props, text } })} />
      ) : block.type === "image" && !block.props.src ? (
        <div className="my-2 flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-600">{t("imagePlaceholder")}</div>
      ) : (
        <div className={incomplete ? "min-h-6 rounded-md outline-1 outline-dashed outline-amber-400/70" : ""}>
          {renderBlock(block, theme) ?? <div className="h-6" />}
        </div>
      )}
    </div>
  )
}
