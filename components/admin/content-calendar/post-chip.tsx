"use client"

import Image from "next/image"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Square, Images, Film, BookOpen } from "lucide-react"
import { getPillar, type ContentPostType } from "@/lib/content-pillars"
import type { ContentPostRow } from "./types"

const POST_TYPE_ICON: Record<ContentPostType, typeof Square> = {
  single: Square,
  carousel: Images,
  reel: Film,
  story: BookOpen,
}

interface PostChipProps {
  post: ContentPostRow
  onSelect?: (id: string) => void
  compact?: boolean
  draggable?: boolean
}

export function PostChip({ post, onSelect, compact = true, draggable = true }: PostChipProps) {
  const pillar = getPillar(post.pillar)
  const Icon = POST_TYPE_ICON[post.postType] ?? Square

  const draggableState = useDraggable({
    id: post.id,
    disabled: !draggable,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = draggableState

  const style = draggable
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
      }
    : undefined

  const hookLine = post.caption.split("\n")[0]?.trim() || "Untitled post"
  const approved = post.status === "approved"
  const bgClass = pillar ? pillar.bgClass : "bg-zinc-800/40"
  const ringClass = pillar ? pillar.ringClass : "ring-zinc-800/50"
  const textClass = pillar ? pillar.textClass : "text-zinc-300"
  const dotClass = pillar ? pillar.dotClass : "bg-zinc-500"

  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      style={style}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      onClick={(e) => {
        e.stopPropagation()
        if (!isDragging) onSelect?.(post.id)
      }}
      className={`group relative select-none rounded-md border border-zinc-800/60 ${bgClass} ring-1 ${ringClass} hover:border-zinc-700 hover:brightness-110 transition-all duration-150 ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${compact ? "px-2 py-1" : "px-2.5 py-2"}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {post.images && post.images.length > 0 ? (
          <span className="relative shrink-0 w-5 h-5 rounded-sm overflow-hidden border border-zinc-800 block">
            <Image
              src={post.images[0].url}
              alt=""
              fill
              sizes="20px"
              className="object-cover"
              unoptimized
            />
            {post.images.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-zinc-950 text-zinc-300 text-[8px] font-bold leading-none px-1 py-0.5 rounded-sm border border-zinc-700">
                {post.images.length}
              </span>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotClass} ring-1 ring-zinc-950`}
            />
          </span>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        )}
        <Icon className={`w-3 h-3 shrink-0 ${textClass}`} />
        <span className="text-[11px] text-zinc-200 truncate leading-tight flex-1">
          {hookLine}
        </span>
        {approved && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Approved" />
        )}
      </div>
    </div>
  )
}

export function PostChipPreview({ post }: { post: ContentPostRow }) {
  return (
    <div className="w-60 rotate-[1.5deg]">
      <PostChip post={post} draggable={false} compact={false} />
    </div>
  )
}
