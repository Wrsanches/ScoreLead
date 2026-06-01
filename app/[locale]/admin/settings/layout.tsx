import { AdminShell } from "@/components/admin-shell"

// Settings is user-scoped (no businessId in the URL) but still needs the admin
// chrome, so it renders its own AdminShell.
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
