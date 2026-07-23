"use client"

import { use } from "react"
import { WhatsAppTemplatesManager } from "@/components/admin/whatsapp/templates-manager"
import { authClient } from "@/lib/auth-client"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { useBusinessAccess } from "@/components/admin/business-context"

export default function WhatsAppTemplatesPage({
  params,
}: {
  params: Promise<{ businessId: string }>
}) {
  const { businessId } = use(params)
  const { readOnly } = useBusinessAccess()
  const { data: session } = authClient.useSession()
  const integrationEnabled =
    process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED === "true" &&
    (readOnly || hasWhatsAppEarlyAccess(session?.user.email))

  if (!integrationEnabled) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">WhatsApp</p>
          <h1 className="mt-3 text-xl font-semibold text-zinc-950 dark:text-zinc-50">Coming soon</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            WhatsApp automation is currently available only to the isolated Meta review account.
          </p>
        </div>
      </main>
    )
  }
  return <WhatsAppTemplatesManager businessId={businessId} />
}
