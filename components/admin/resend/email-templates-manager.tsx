"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Code2, FileText, LayoutTemplate, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Link } from "@/i18n/routing"
import type { EmailTemplateRow } from "@/lib/resend/data"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"
import type { EmailComponentKind, EmailComponentSet } from "@/lib/resend/blocks"
import { EMAIL_COMPONENT_KINDS } from "@/lib/resend/blocks"
import { DEFAULT_BRAND_THEME, type BrandTheme } from "@/lib/emails/blocks/theme"
import type { EmailContext } from "@/lib/resend/render"
import { SharedComponentDialog } from "./shared-component-dialog"
import { readJson } from "./errors"

type TemplateListItem = Omit<EmailTemplateRow, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export function EmailTemplatesManager({ businessId }: { businessId: string }) {
  const t = useTranslations("resend")
  const ti = useTranslations("integrations")
  const td = useTranslations("dashboard")
  const { readOnly } = useBusinessAccess()
  const { can: planCan, openUpgrade } = usePlan()
  const enabled = isResendIntegrationEnabled()
  const canUse = planCan("emailOutreach")

  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [gate, setGate] = useState<"plan" | "flag" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [components, setComponents] = useState<EmailComponentSet>({ header: null, footer: null })
  const [theme, setTheme] = useState<BrandTheme>(DEFAULT_BRAND_THEME)
  const [logo, setLogo] = useState<string | null>(null)
  const [editingKind, setEditingKind] = useState<EmailComponentKind | null>(null)
  const [previewContext, setPreviewContext] = useState<EmailContext | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/templates`)
      const body = await readJson<{ templates?: TemplateListItem[]; code?: string }>(response)
      if (response.status === 402) {
        setGate("plan")
        return
      }
      if (response.status === 403) {
        setGate("flag")
        return
      }
      if (!response.ok) throw new Error()
      setGate(null)
      setTemplates(body?.templates ?? [])
      const shared = await fetch(`/api/businesses/${businessId}/resend/components`)
      const sharedBody = await readJson<{ components?: EmailComponentSet; theme?: BrandTheme; logo?: string | null; previewContext?: EmailContext }>(shared)
      if (shared.ok && sharedBody?.components) {
        setComponents(sharedBody.components)
        if (sharedBody.theme) setTheme(sharedBody.theme)
        setLogo(sharedBody.logo ?? null)
        if (sharedBody.previewContext) setPreviewContext(sharedBody.previewContext)
      }
    } catch {
      toast.error(t("loadError"))
    } finally {
      setLoading(false)
    }
  }, [businessId, t])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/templates/${deleteTarget.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      setTemplates((prev) => prev.filter((row) => row.id !== deleteTarget.id))
      toast.success(t("tplDeleted"))
      setDeleteTarget(null)
    } catch {
      toast.error(t("tplDeleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  const breadcrumbs = [
    { label: td("businessPage"), href: "/admin/profile" },
    { label: ti("title"), href: "/admin/integrations" },
    { label: ti("resendSetupTitle"), href: "/admin/integrations/resend" },
    { label: ti("emailTemplatesTitle") },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={ti("emailTemplatesTitle")}
          description={t("templatesDescription")}
          breadcrumbs={breadcrumbs}
          actions={
            !readOnly && enabled && canUse && gate === null ? (
              <Button asChild>
                <Link href="/admin/integrations/email-templates/new">
                  <Plus className="size-4" />
                  {t("newTemplate")}
                </Link>
              </Button>
            ) : undefined
          }
        />

        {!enabled || gate === "flag" ? (
          <EmptyState icon={FileText} title={t("comingSoonTitle")} description={t("comingSoonDescription")} />
        ) : !canUse || gate === "plan" ? (
          <EmptyState
            icon={FileText}
            title={t("planRequiredTitle")}
            description={t("planRequired")}
            action={<Button onClick={() => openUpgrade("emailOutreach")}>{t("upgradeButton")}</Button>}
          />
        ) : loading ? (
          <LoadingState />
        ) : (
          <>
          <section className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("sharedTitle")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {EMAIL_COMPONENT_KINDS.map((kind) => {
                const label = t(`shared${kind[0].toUpperCase()}${kind.slice(1)}`)
                const customized = components[kind] !== null
                return (
                  <div key={kind} className="glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{label}</p>
                      <p className={`mt-0.5 text-[11px] ${customized ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500"}`}>{customized ? t("sharedCustomized") : t("sharedDefaults")}</p>
                    </div>
                    {!readOnly && (
                      <Button variant="outline" size="sm" onClick={() => setEditingKind(kind)}>
                        <Pencil className="size-3.5" />
                        {t("edit")}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
          {templates.length === 0 ? (
          <div className="glass-card rounded-2xl">
            <EmptyState
              icon={FileText}
              title={t("tplEmptyTitle")}
              description={t("tplEmptyBody")}
              action={
                !readOnly ? (
                  <Button asChild>
                    <Link href="/admin/integrations/email-templates/new">
                      <Plus className="size-4" />
                      {t("newTemplate")}
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <ul className="space-y-2">
            {templates.map((row) => (
              <li
                key={row.id}
                className="glass-card flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.1]">
                  {row.bodyMode === "html" ? <Code2 className="size-4" /> : <LayoutTemplate className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/integrations/email-templates/${row.id}`} className="block truncate text-sm font-semibold text-zinc-950 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-300">
                    {row.name}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">{row.subject}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500">
                    {row.bodyMode === "html" ? t("tplModeHtml") : t("tplModeEditor")}
                    <span className="mx-1.5 text-zinc-400 dark:text-zinc-700">/</span>
                    {new Date(row.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/integrations/email-templates/${row.id}`}>
                        <Pencil className="size-3.5" />
                        {t("edit")}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(row)}
                      className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                      aria-label={t("delete")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          )}
          </>
        )}

      </ContentWrapper>

      {editingKind && (
        <SharedComponentDialog
          businessId={businessId}
          kind={editingKind}
          open
          onOpenChange={(open) => !open && setEditingKind(null)}
          components={components}
          theme={theme}
          logoFallback={logo}
          previewContext={previewContext}
          onSaved={setComponents}
        />
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !deleting && !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tplDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tplDeleteBody", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
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
