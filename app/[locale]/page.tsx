import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { LandingPage } from "@/components/landing-page"
import { generateJsonLd, generateSiteMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return generateSiteMetadata(locale)
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const jsonLd = generateJsonLd(locale)

  return (
    <>
      <JsonLd data={jsonLd} />
      <main id="main">
        <LandingPage />
      </main>
    </>
  )
}
