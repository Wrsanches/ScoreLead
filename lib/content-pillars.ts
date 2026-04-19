export type ContentPillar = "educate" | "showcase" | "story" | "proof" | "engagement"

export type ContentPostType = "single" | "carousel" | "reel" | "story"

export interface PillarMeta {
  key: ContentPillar
  label: string
  dotClass: string
  bgClass: string
  textClass: string
  ringClass: string
  hexHint: string
}

export const PILLARS: PillarMeta[] = [
  {
    key: "educate",
    label: "Educate",
    dotClass: "bg-emerald-400",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-300",
    ringClass: "ring-emerald-500/30",
    hexHint: "#34d399",
  },
  {
    key: "showcase",
    label: "Showcase",
    dotClass: "bg-sky-400",
    bgClass: "bg-sky-500/10",
    textClass: "text-sky-300",
    ringClass: "ring-sky-500/30",
    hexHint: "#38bdf8",
  },
  {
    key: "story",
    label: "Story",
    dotClass: "bg-violet-400",
    bgClass: "bg-violet-500/10",
    textClass: "text-violet-300",
    ringClass: "ring-violet-500/30",
    hexHint: "#a78bfa",
  },
  {
    key: "proof",
    label: "Proof",
    dotClass: "bg-amber-400",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-300",
    ringClass: "ring-amber-500/30",
    hexHint: "#fbbf24",
  },
  {
    key: "engagement",
    label: "Engagement",
    dotClass: "bg-rose-400",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-300",
    ringClass: "ring-rose-500/30",
    hexHint: "#fb7185",
  },
]

export const PILLAR_BY_KEY: Record<ContentPillar, PillarMeta> = PILLARS.reduce(
  (acc, p) => {
    acc[p.key] = p
    return acc
  },
  {} as Record<ContentPillar, PillarMeta>,
)

export function getPillar(key: string | null | undefined): PillarMeta | null {
  if (!key) return null
  return PILLAR_BY_KEY[key as ContentPillar] ?? null
}

export const POST_TYPES: { key: ContentPostType; label: string }[] = [
  { key: "single", label: "Single" },
  { key: "carousel", label: "Carousel" },
  { key: "reel", label: "Reel" },
  { key: "story", label: "Story" },
]
