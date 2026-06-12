import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "leadsKanban")
}

export default function LeadsKanbanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
