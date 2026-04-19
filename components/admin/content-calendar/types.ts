import type { ContentPillar, ContentPostType } from "@/lib/content-pillars"

export interface ContentPostRow {
  id: string
  userId: string
  businessId: string
  provider: string
  scheduledFor: string
  postType: ContentPostType
  pillar: ContentPillar | null
  caption: string
  hashtags: string[] | null
  visualIdea: string | null
  callToAction: string | null
  images: { url: string; headline: string; prompt: string }[] | null
  status: "draft" | "approved"
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}
