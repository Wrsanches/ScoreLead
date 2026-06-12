import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo"

// Covers the discovery-jobs list, the new-job form, and job detail pages
// (all client components).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "discovery")
}

export default function DiscoveryJobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
