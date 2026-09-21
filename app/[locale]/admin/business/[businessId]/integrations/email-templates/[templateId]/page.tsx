"use client"

import { use } from "react"
import { EmailTemplatePage } from "@/components/admin/resend/email-template-page"
import { useBusinessAccess } from "@/components/admin/business-context"

/** `new` opens a blank template; any other id edits that template. */
export default function EmailTemplateEditorPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params)
  const { businessId } = useBusinessAccess()
  return (
    <EmailTemplatePage
      key={templateId}
      businessId={businessId}
      templateId={templateId === "new" ? null : templateId}
    />
  )
}
