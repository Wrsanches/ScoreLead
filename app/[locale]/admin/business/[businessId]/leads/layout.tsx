import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo"

// The leaf pages here are client components and can't export metadata, so the
// title lives in this server layout. Auth/chrome are handled by ancestors.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "leads")
}

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
