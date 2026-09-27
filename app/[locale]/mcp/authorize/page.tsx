import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { consentBusinesses, getMcpAuthorization } from "@/lib/mcp/oauth"
import { McpConsent } from "@/components/admin/google-reporting/mcp-consent"
export const metadata: Metadata = {
  title: "Authorize analytics access",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}
export default async function ConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ request?: string }>
}) {
  const { locale } = await params,
    { request: id } = await searchParams
  const t = await getTranslations("googleReporting")
  let pending: Awaited<ReturnType<typeof getMcpAuthorization>>
  try {
    pending = await getMcpAuthorization(id || "")
  } catch {
    return (
      <main id="main" className="mx-auto max-w-xl px-5 py-24">
        <h1 className="text-2xl font-semibold">{t("consentTitle")}</h1>
        <p role="alert" className="mt-4 text-zinc-400">
          {t("errors.AUTHORIZATION_EXPIRED")}
        </p>
      </main>
    )
  }
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    const prefix = locale === "en" ? "" : `/${locale}`
    redirect(
      `${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/mcp/authorize?request=${pending.authorization.id}`)}`,
    )
  }
  return (
    <McpConsent
      requestId={pending.authorization.id}
      clientName={pending.clientName}
      redirectOrigin={new URL(pending.authorization.redirectUri).origin}
      businesses={await consentBusinesses(session.user.id)}
    />
  )
}
