export type LegalDocumentKey = "privacy" | "terms" | "dataDeletion"

export type LegalLink = {
  label: string
  href: string
  external?: boolean
}

export type LegalSection = {
  id: string
  title: string
  paragraphs?: string[]
  bullets?: string[]
  steps?: string[]
  note?: string
  links?: LegalLink[]
}

export type LegalDocumentContent = {
  eyebrow: string
  title: string
  description: string
  updatedLabel: string
  updatedDate: string
  tocLabel: string
  homeLabel: string
  contactLabel: string
  contactDescription: string
  sections: LegalSection[]
}
