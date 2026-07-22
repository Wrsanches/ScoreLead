import type { Metadata } from "next"

export const metadata: Metadata = { title: "Support · ScoreLead" }

// AdminShell (sidebar/chrome) is rendered once by the parent admin layout; this
// layout only sets the page metadata.
export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
