import type { BlogLocale } from "@/lib/blog/types"

export type MarketingLocale = BlogLocale

export type MarketingPageGroup =
  | "features"
  | "use-cases"
  | "compare"
  | "case-studies"
  | "tools"
  | "company"

export type MarketingPageSection = {
  heading: string
  paragraphs: string[]
  points?: string[]
}

export type MarketingPageTranslation = {
  eyebrow: string
  title: string
  description: string
  answer: string
  highlights: string[]
  sections: MarketingPageSection[]
  proofLabel: string
  proof: string
  ctaTitle: string
  ctaDescription: string
  ctaLabel: string
}

export type MarketingPageDefinition = {
  id: string
  group: MarketingPageGroup
  slug: string
  pathname: string
  updatedAt: string
  keywords: string[]
  relatedBlogSlugs: string[]
}

export type MarketingPage = MarketingPageDefinition & {
  translations: Record<MarketingLocale, MarketingPageTranslation>
}

export type MarketingUi = {
  home: string
  overview: string
  keyOutcomes: string
  evidence: string
  relatedGuides: string
  relatedGuidesDescription: string
  readGuide: string
  lastReviewed: string
  methodology: string
  methodologyDescription: string
  editorialPolicy: string
  startFree: string
}
