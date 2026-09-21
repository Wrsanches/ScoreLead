"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Check, Loader2, Send, Trash2 } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { ContentWrapper, EmptyState, LoadingState, PageHeader } from "@/components/admin"
import { useBusinessAccess } from "@/components/admin/business-context"
import { usePlan } from "@/components/admin/plan-context"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { EmailTemplateRow } from "@/lib/resend/data"
import type { EmailComponentSet } from "@/lib/resend/blocks"
import type { ProductImage } from "@/lib/product-images"
import { DEFAULT_BRAND_THEME, type BrandTheme } from "@/lib/emails/blocks/theme"
import type { EmailContext } from "@/lib/resend/render"
import type { EmailTemplateFormInput } from "@/lib/resend/template-form"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"
import { EmailTemplateEditor, type EmailTemplateEditorHandle, type EditorInitial } from "./email-template-editor"
import { readJson, resendErrorMessage } from "./errors"

const LIST_HREF = "/admin/integrations/email-templates"

type TemplateView = Omit<EmailTemplateRow, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }

/**
 * Full-page template editor, same shape as the content calendar's post
 * editor: header carries the actions, the body is the form with a sticky
 * preview. `templateId === null` creates a new template.
 */
export function EmailTemplatePage({ businessId, templateId }: { businessId: string; templateId: string | null }) {
  const t = useTranslations("resend")
  const ti = useTranslations("integrations")
  const td = useTranslations("dashboard")
  const router = useRouter()
  const { readOnly } = useBusinessAccess()
  const { can: planCan } = usePlan()
  const enabled = isResendIntegrationEnabled()
  const canUse = planCan("emailOutreach")

  const editorRef = useRef<EmailTemplateEditorHandle>(null)
  const [template, setTemplate] = useState<TemplateView | null>(null)
  const [loading, setLoading] = useState(templateId !== null)
  const [components, setComponents] = useState<EmailComponentSet>({ header: null, footer: null })
  const [theme, setTheme] = useState<BrandTheme>(DEFAULT_BRAND_THEME)
  const [logo, setLogo] = useState<string | null>(null)
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [componentsReady, setComponentsReady] = useState(false)
  const [languageLabel, setLanguageLabel] = useState("English")
  const [previewContext, setPreviewContext] = useState<EmailContext | undefined>(undefined)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/businesses/${businessId}/resend/components`, { signal: controller.signal })
      .then(async (response) => {
        const body = await readJson<{ components?: EmailComponentSet; theme?: BrandTheme; logo?: string | null; productImages?: ProductImage[]; languageLabel?: string; previewContext?: EmailContext }>(response)
        if (response.ok && body?.components) {
          setComponents(body.components)
          if (body.theme) setTheme(body.theme)
          setLogo(body.logo ?? null)
          setProductImages(body.productImages ?? [])
          if (body.languageLabel) setLanguageLabel(body.languageLabel)
          if (body.previewContext) setPreviewContext(body.previewContext)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setComponentsReady(true)
      })
    return () => controller.abort()
  }, [businessId])
  const [missing, setMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!templateId) return
    const controller = new AbortController()
    fetch(`/api/businesses/${businessId}/resend/templates/${templateId}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) {
          setMissing(true)
          return
        }
        const body = await readJson<{ template?: TemplateView }>(response)
        if (!response.ok || !body?.template) throw new Error()
        setTemplate(body.template)
      })
      .catch(() => {
        if (!controller.signal.aborted) toast.error(t("loadError"))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [businessId, templateId, t])

  async function save(input: EmailTemplateFormInput) {
    setSaving(true)
    try {
      const url = templateId
        ? `/api/businesses/${businessId}/resend/templates/${templateId}`
        : `/api/businesses/${businessId}/resend/templates`
      const response = await fetch(url, {
        method: templateId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const body = await readJson<{ template?: TemplateView; error?: string; code?: string; unknownVariables?: string[] }>(response)
      if (!response.ok || !body?.template) {
        if (body?.code === "UNKNOWN_VARIABLE" && body.unknownVariables?.length) {
          toast.error(t("tplUnknownVariables", { names: body.unknownVariables.join(", ") }))
        } else {
          toast.error(resendErrorMessage(t, body, "tplSaveFailed"))
        }
        return
      }
      toast.success(t("tplSaved"))
      router.push(LIST_HREF)
    } catch {
      toast.error(t("tplSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!templateId) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/templates/${templateId}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      toast.success(t("tplDeleted"))
      router.push(LIST_HREF)
    } catch {
      toast.error(t("tplDeleteFailed"))
      setDeleting(false)
    }
  }

  const title = templateId ? (template?.name || t("editTemplate")) : t("newTemplate")
  const breadcrumbs = [
    { label: td("businessPage"), href: "/admin/profile" },
    { label: ti("title"), href: "/admin/integrations" },
    { label: ti("resendSetupTitle"), href: "/admin/integrations/resend" },
    { label: ti("emailTemplatesTitle"), href: LIST_HREF },
    { label: title },
  ]

  const gated = !enabled || !canUse

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={title}
          description={gated ? undefined : t("tplFormHint")}
          breadcrumbs={breadcrumbs}
          actions={
            !gated && !readOnly && !loading && !missing ? (
              <div className="flex items-center gap-2">
                {templateId && (
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    disabled={saving || deleting}
                    aria-label={t("delete")}
                    title={t("delete")}
                    className="size-9 px-0 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
                <Button variant="outline" onClick={() => editorRef.current?.openTestSend()} disabled={saving || deleting} className="gap-1.5">
                  <Send className="size-4" aria-hidden="true" />
                  {t("tplTestSend")}
                </Button>
                <Button onClick={() => editorRef.current?.submit()} disabled={saving || deleting}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {t("tplSave")}
                </Button>
              </div>
            ) : undefined
          }
        />

        {gated ? (
          <EmptyState icon={Trash2} title={t("planRequiredTitle")} description={t("planRequired")} />
        ) : loading || !componentsReady ? (
          <LoadingState />
        ) : missing ? (
          <EmptyState title={t("tplNotFound")} action={<Button variant="outline" onClick={() => router.push(LIST_HREF)}>{ti("emailTemplatesTitle")}</Button>} />
        ) : (
          <fieldset disabled={readOnly} className="min-w-0">
            <EmailTemplateEditor
              ref={editorRef}
              businessId={businessId}
              initial={template as EditorInitial}
              saving={saving}
              readOnly={readOnly}
              components={components}
              theme={theme}
              logoFallback={logo}
              productImages={productImages}
              languageLabel={languageLabel}
              previewContext={previewContext}
              onComponentsChanged={setComponents}
              onSave={save}
            />
          </fieldset>
        )}
      </ContentWrapper>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tplDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("tplDeleteBody", { name: template?.name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                void remove()
              }}
              className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
