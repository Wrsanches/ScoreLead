import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { MarketingPageView } from "@/components/marketing-page"
import {
  generateMarketingMetadata,
  getMarketingPage,
  getMarketingPagesByGroup,
} from "@/lib/marketing"
import { normalizeLocale } from "@/lib/seo"

type PageParams = Promise<{ locale: string; slug: string }>

export const dynamicParams = false

export function generateStaticParams() {
  return getMarketingPagesByGroup("features").map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params
  const page = getMarketingPage("features", slug)
  if (!page) notFound()
  return generateMarketingMetadata(page, locale)
}

export default async function FeaturePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params
  const page = getMarketingPage("features", slug)
  if (!page) notFound()
  const normalizedLocale = normalizeLocale(locale)
  setRequestLocale(normalizedLocale)
  return <MarketingPageView page={page} locale={normalizedLocale} />
}
