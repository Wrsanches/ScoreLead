import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { ContactSection } from "@/components/contact-section"
import { Navbar } from "@/components/navbar"
import { WaitlistFooter } from "@/components/waitlist-footer"
import {
  generatePageMetadata,
} from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "contact", {
    index: true,
    pathname: "contact",
  })
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="marketing-canvas min-h-screen text-zinc-100">
      <Navbar />

      <main id="main" className="pt-20">
        <ContactSection />
      </main>

      <WaitlistFooter />
    </div>
  )
}
