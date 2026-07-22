import type { Metadata } from "next"
import { headers } from "next/headers"
import { AdminShell } from "@/components/admin-shell"
import { auth } from "@/lib/auth"

export const metadata: Metadata = { title: "Support · ScoreLead" }

// Support is user-scoped (no businessId in the URL) but still needs the admin
// chrome, so it renders its own AdminShell - mirroring the settings layout.
export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  return <AdminShell userEmail={session?.user.email}>{children}</AdminShell>
}
