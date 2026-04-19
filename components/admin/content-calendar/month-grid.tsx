"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { motion } from "framer-motion"
import { DayCell } from "./day-cell"
import { PostChipPreview } from "./post-chip"
import type { ContentPostRow } from "./types"

interface MonthGridProps {
  monthStart: Date
  monthEnd: Date
  posts: ContentPostRow[]
  onSelectPost: (id: string) => void
  onAddPost: (date: Date) => void
  onReschedule: (postId: string, newDate: Date) => void
  weekdayLabels: string[]
  /** 0 = Sunday, 1 = Monday. Defaults to 1 (Monday). */
  weekStartsOn?: 0 | 1
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfGrid(monthStart: Date, weekStartsOn: 0 | 1): Date {
  const d = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1),
  )
  const dow = d.getUTCDay()
  const shift = weekStartsOn === 0 ? dow : (dow + 6) % 7
  d.setUTCDate(d.getUTCDate() - shift)
  return d
}

function endOfGrid(start: Date): Date {
  const d = new Date(start)
  d.setUTCDate(d.getUTCDate() + 41)
  return d
}

export function MonthGrid({
  monthStart,
  monthEnd,
  posts,
  onSelectPost,
  onAddPost,
  onReschedule,
  weekdayLabels,
  weekStartsOn = 1,
}: MonthGridProps) {
  const [activePost, setActivePost] = useState<ContentPostRow | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const days = useMemo(() => {
    const start = startOfGrid(monthStart, weekStartsOn)
    const end = endOfGrid(start)
    const list: Date[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      list.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return list
  }, [monthStart, weekStartsOn])

  const postsByDay = useMemo(() => {
    const map = new Map<string, ContentPostRow[]>()
    for (const p of posts) {
      const key = isoDay(new Date(p.scheduledFor))
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
      )
    }
    return map
  }, [posts])

  const today = new Date()
  const todayKey = isoDay(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
  )

  function handleDragStart(e: DragStartEvent) {
    const post = posts.find((p) => p.id === e.active.id)
    setActivePost(post ?? null)
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActivePost(null)
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith("day-")) return
    const newIso = overId.slice(4)
    const post = posts.find((p) => p.id === active.id)
    if (!post) return
    const current = new Date(post.scheduledFor)
    const currentIso = isoDay(current)
    if (currentIso === newIso) return
    const [y, m, d] = newIso.split("-").map(Number)
    const newDate = new Date(
      Date.UTC(
        y,
        m - 1,
        d,
        current.getUTCHours(),
        current.getUTCMinutes(),
        0,
      ),
    )
    onReschedule(post.id, newDate)
  }

  function handleDragCancel() {
    setActivePost(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold text-center py-1.5"
          >
            {label}
          </div>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-7 gap-1.5">
        {days.map((date, i) => {
          const key = isoDay(date)
          const inMonth = date >= monthStart && date < monthEnd
          const isToday = key === todayKey
          const isPast = date.getTime() < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
          const dayPosts = postsByDay.get(key) ?? []
          return (
            <DayCell
              key={key}
              date={date}
              posts={dayPosts}
              inMonth={inMonth}
              isToday={isToday}
              isPast={isPast}
              onSelectPost={onSelectPost}
              onAdd={onAddPost}
              animationIndex={i}
            />
          )
        })}
      </motion.div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activePost ? <PostChipPreview post={activePost} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
