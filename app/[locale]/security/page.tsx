import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { MarketingPageView } from "@/components/marketing-page"
import { generateMarketingMetadata, getMarketingPage } from "@/lib/marketing"
import { normalizeLocale } from "@/lib/seo"

type PageParams = Promise<{ locale: string }>
const page = getMarketingPage("company", "security")!

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params
  return generateMarketingMetadata(page, locale)
}

export default async function SecurityPage({ params }: { params: PageParams }) {
  const { locale } = await params
  const normalizedLocale = normalizeLocale(locale)
  setRequestLocale(normalizedLocale)
  return <MarketingPageView page={page} locale={normalizedLocale} />
}
