"use client"

import { use } from "react"
import { WhatsAppTemplatesManager } from "@/components/admin/whatsapp/templates-manager"

export default function WhatsAppTemplatesPage({
  params,
}: {
  params: Promise<{ businessId: string }>
}) {
  const { businessId } = use(params)
  return <WhatsAppTemplatesManager businessId={businessId} />
}
