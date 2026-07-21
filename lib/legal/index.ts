import { legalContentEn } from "./en"
import { legalContentEs } from "./es"
import { legalContentPt } from "./pt"
import type { LegalDocumentContent, LegalDocumentKey } from "./types"

const contentByLocale = {
  en: legalContentEn,
  pt: legalContentPt,
  es: legalContentEs,
} as const

export function getLegalContent(locale: string, document: LegalDocumentKey): LegalDocumentContent {
  const normalizedLocale = locale in contentByLocale ? (locale as keyof typeof contentByLocale) : "en"
  return contentByLocale[normalizedLocale][document]
}

export type { LegalDocumentContent, LegalDocumentKey } from "./types"
