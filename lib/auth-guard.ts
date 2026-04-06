import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function requireAuth(locale: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    const prefix = locale === "en" ? "" : `/${locale}`
    redirect(`${prefix}/login`)
  }

  return session
}
