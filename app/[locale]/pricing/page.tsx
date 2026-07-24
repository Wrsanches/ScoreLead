import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { PricingPageView } from "@/components/pricing-page"
import { generateMarketingMetadata, getMarketingPage } from "@/lib/marketing"
import { normalizeLocale } from "@/lib/seo"

type PageParams = Promise<{ locale: string }>
const page = getMarketingPage("company", "pricing")!

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params
  return generateMarketingMetadata(page, locale)
}

export default async function PricingPage({ params }: { params: PageParams }) {
  const { locale } = await params
  const normalizedLocale = normalizeLocale(locale)
  setRequestLocale(normalizedLocale)
  return <PricingPageView page={page} locale={normalizedLocale} />
}
