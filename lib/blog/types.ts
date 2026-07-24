export type BlogLocale = "en" | "pt" | "es"

export type BlogAccent = "emerald" | "cyan" | "violet" | "amber" | "rose"

export type BlogSection = {
  heading: string
  paragraphs: string[]
  points?: string[]
}

export type BlogTranslation = {
  title: string
  description: string
  category: string
  keywords: string[]
  introduction: string[]
  sections: BlogSection[]
  conclusion: {
    heading: string
    paragraphs: string[]
  }
}

export type BlogPost = {
  slug: string
  publishedAt: string
  updatedAt: string
  readingMinutes: number
  accent: BlogAccent
  quickAnswers: Record<BlogLocale, string>
  fieldNotes: Record<BlogLocale, string>
  relatedMarketingPath: string
  sources: BlogSource[]
  translations: Record<BlogLocale, BlogTranslation>
}

export type BlogSource = {
  title: string
  publisher: string
  url: string
}

export type BlogUi = {
  metadataTitle: string
  metadataDescription: string
  eyebrow: string
  title: string
  description: string
  featured: string
  latest: string
  readArticle: string
  minRead: string
  published: string
  updated: string
  authoredBy: string
  reviewedBy: string
  reviewerName: string
  backToBlog: string
  quickAnswer: string
  fieldNote: string
  decisionTable: string
  decision: string
  whatToCheck: string
  practicalChecklist: string
  sources: string
  sourcesDescription: string
  productGuide: string
  editorialPolicy: string
  takeaway: string
  relatedTitle: string
  relatedDescription: string
  ctaEyebrow: string
  ctaTitle: string
  ctaDescription: string
  ctaLabel: string
}
