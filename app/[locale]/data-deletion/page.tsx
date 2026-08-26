import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { LegalDocument } from "@/components/legal-document"
import { getLegalContent } from "@/lib/legal"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "dataDeletion", {
    index: true,
    pathname: "data-deletion",
  })
}

export default async function DataDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <LegalDocument content={getLegalContent(locale, "dataDeletion")} />
}
