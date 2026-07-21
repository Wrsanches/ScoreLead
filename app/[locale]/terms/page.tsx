import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { LegalDocument } from "@/components/legal-document"
import { getLegalContent } from "@/lib/legal"
import { generatePageMetadata, getLanguageAlternates, getLocalizedUrl } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    ...generatePageMetadata(locale, "terms", { index: true }),
    alternates: {
      canonical: getLocalizedUrl(locale, "terms"),
      languages: getLanguageAlternates("terms"),
    },
  }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <LegalDocument content={getLegalContent(locale, "terms")} />
}
