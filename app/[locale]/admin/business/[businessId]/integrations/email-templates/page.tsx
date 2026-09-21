"use client"

import { EmailTemplatesManager } from "@/components/admin/resend/email-templates-manager"
import { useBusinessAccess } from "@/components/admin/business-context"

export default function EmailTemplatesPage() {
  const { businessId } = useBusinessAccess()
  return <EmailTemplatesManager businessId={businessId} />
}
