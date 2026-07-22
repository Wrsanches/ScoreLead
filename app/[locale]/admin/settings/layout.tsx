import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "settings")
}

// AdminShell (sidebar/chrome) is rendered once by the parent admin layout; this
// layout only sets the page metadata.
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
