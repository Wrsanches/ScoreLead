import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { ContactSection } from "@/components/contact-section"
import { Navbar } from "@/components/navbar"
import { WaitlistFooter } from "@/components/waitlist-footer"
import {
  generatePageMetadata,
  getLanguageAlternates,
  getLocalizedUrl,
} from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    ...generatePageMetadata(locale, "contact", { index: true }),
    alternates: {
      canonical: getLocalizedUrl(locale, "contact"),
      languages: getLanguageAlternates("contact"),
    },
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <Navbar />

      <main id="main" className="pt-16">
        <ContactSection />
      </main>

      <WaitlistFooter />
    </div>
  )
}
