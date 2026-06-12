import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo"

// The page is a client component; its title/description live here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "resetPassword")
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
