"use client"

import { useDroppable } from "@dnd-kit/core"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { PostChip } from "./post-chip"
import type { ContentPostRow } from "./types"

interface DayCellProps {
  date: Date
  posts: ContentPostRow[]
  inMonth: boolean
  isToday: boolean
  isPast: boolean
  onSelectPost: (id: string) => void
  onAdd: (date: Date) => void
  animationIndex: number
}

const MAX_VISIBLE_CHIPS = 3

export function DayCell({
  date,
  posts,
  inMonth,
  isToday,
  isPast,
  onSelectPost,
  onAdd,
  animationIndex,
}: DayCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${date.toISOString().slice(0, 10)}`,
    data: { date },
  })

  const visible = posts.slice(0, MAX_VISIBLE_CHIPS)
  const hidden = Math.max(0, posts.length - MAX_VISIBLE_CHIPS)

  const base =
    "group relative flex flex-col rounded-xl border transition-all duration-150 min-h-32 sm:min-h-35 p-2"
  const state = isOver
    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_32px_-12px_rgba(16,185,129,0.4)]"
    : isToday
      ? "border-emerald-500/40 bg-zinc-900/40 ring-1 ring-emerald-500/30"
      : inMonth
        ? "border-zinc-800/70 bg-zinc-900/20 hover:border-zinc-700/70 hover:bg-zinc-900/40"
        : "border-zinc-900/60 bg-zinc-950/30"

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(animationIndex, 30) * 0.01 }}
      className={`${base} ${state} ${isPast && inMonth ? "opacity-75" : ""} ${!inMonth ? "opacity-40" : ""}`}
      onClick={() => inMonth && onAdd(date)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-xs font-semibold tabular-nums ${
            isToday
              ? "text-emerald-300"
              : inMonth
                ? isPast
                  ? "text-zinc-600"
                  : "text-zinc-300"
                : "text-zinc-700"
          }`}
        >
          {date.getUTCDate()}
        </span>
        {inMonth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAdd(date)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md flex items-center justify-center text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10"
            aria-label="Add post"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
        {visible.map((p) => (
          <PostChip key={p.id} post={p} onSelect={onSelectPost} />
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectPost(posts[MAX_VISIBLE_CHIPS].id)
            }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 text-left px-1.5 transition-colors"
          >
            +{hidden} more
          </button>
        )}
      </div>
    </motion.div>
  )
}
