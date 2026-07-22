"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { ContentWrapper, PageHeader } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
import { countBodyVariables } from "@/lib/whatsapp/template-form"

type TemplateComponent = {
  type: string
  format?: string
  text?: string
  buttons?: Array<Record<string, unknown>>
  example?: Record<string, unknown>
}

type TemplateRow = {
  id: string
  name: string
  language: string
  category: string
  status: string
  components: TemplateComponent[]
  rejectionReason: string | null
  updatedAt: string
}

type ButtonInput =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string }
  | { type: "PHONE_NUMBER"; text: string; phoneNumber: string }

type FormState = {
  name: string
  language: string
  category: "MARKETING" | "UTILITY"
  headerText: string
  body: string
  bodyExamples: string[]
  footerText: string
  buttons: ButtonInput[]
}

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

const LANGUAGES = [
  "en_US",
  "en_GB",
  "pt_BR",
  "pt_PT",
  "es_ES",
  "es_MX",
  "fr_FR",
  "de_DE",
  "it_IT",
]

function emptyForm(): FormState {
  return {
    name: "",
    language: "en_US",
    category: "MARKETING",
    headerText: "",
    body: "",
    bodyExamples: [],
    footerText: "",
    buttons: [],
  }
}

function findComponent(components: TemplateComponent[], type: string) {
  return components.find((c) => c.type.toUpperCase() === type)
}

/** Rebuild the editable form from a stored template's components. */
function formFromRow(row: TemplateRow): FormState {
  const header = findComponent(row.components, "HEADER")
  const body = findComponent(row.components, "BODY")
  const footer = findComponent(row.components, "FOOTER")
  const buttonsComp = findComponent(row.components, "BUTTONS")
  const exampleRow = (body?.example?.body_text as string[][] | undefined)?.[0] ?? []

  const buttons: ButtonInput[] = (buttonsComp?.buttons ?? []).map((b) => {
    const type = String(b.type ?? "").toUpperCase()
    const text = typeof b.text === "string" ? b.text : ""
    if (type === "URL") return { type: "URL", text, url: String(b.url ?? "") }
    if (type === "PHONE_NUMBER") {
      return { type: "PHONE_NUMBER", text, phoneNumber: String(b.phone_number ?? "") }
    }
    return { type: "QUICK_REPLY", text }
  })

  return {
    name: row.name,
    language: row.language,
    category: (row.category.toUpperCase() === "UTILITY" ? "UTILITY" : "MARKETING"),
    headerText: typeof header?.text === "string" ? header.text : "",
    body: typeof body?.text === "string" ? body.text : "",
    bodyExamples: exampleRow,
    footerText: typeof footer?.text === "string" ? footer.text : "",
    buttons,
  }
}

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30"
    case "PENDING":
    case "IN_APPEAL":
    case "PENDING_DELETION":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30"
    case "REJECTED":
    case "DISABLED":
    case "PAUSED":
      return "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30"
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 ring-zinc-500/30"
  }
}

export function WhatsAppTemplatesManager({ businessId }: { businessId: string }) {
  const t = useTranslations("whatsapp")
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<TemplateRow | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TemplateRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/whatsapp/templates?scope=all`,
      )
      if (res.ok) {
        const body = await res.json()
        setTemplates(body.templates ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    load()
  }, [load])

  async function sync() {
    setSyncing(true)
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/whatsapp/templates/sync`,
        { method: "POST" },
      )
      if (!res.ok) throw new Error()
      await load()
      toast.success(t("tplSynced"))
    } catch {
      toast.error(t("tplSyncFailed"))
    } finally {
      setSyncing(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  function openEdit(row: TemplateRow) {
    setEditing(row)
    setForm(formFromRow(row))
    setSheetOpen(true)
  }

  // Keep the example inputs in lockstep with the numbered variables in the body.
  const variableCount = useMemo(
    () => countBodyVariables(form.body),
    [form.body],
  )
  useEffect(() => {
    setForm((f) => {
      if (f.bodyExamples.length === variableCount) return f
      const next = f.bodyExamples.slice(0, variableCount)
      while (next.length < variableCount) next.push("")
      return { ...f, bodyExamples: next }
    })
  }, [variableCount])

  function patch(update: Partial<FormState>) {
    setForm((f) => ({ ...f, ...update }))
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        language: form.language,
        category: form.category,
        headerText: form.headerText.trim() || undefined,
        body: form.body,
        bodyExamples: form.bodyExamples.length ? form.bodyExamples : undefined,
        footerText: form.footerText.trim() || undefined,
        buttons: form.buttons.length ? form.buttons : undefined,
      }
      const url = editing
        ? `/api/businesses/${businessId}/whatsapp/templates/${editing.id}`
        : `/api/businesses/${businessId}/whatsapp/templates`
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.error ?? t("tplSaveFailed"))
      }
      toast.success(editing ? t("tplUpdated") : t("tplSubmitted"))
      setSheetOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("tplSaveFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/whatsapp/templates/${deleteTarget.id}`,
        { method: "DELETE" },
      )
      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.error ?? t("tplDeleteFailed"))
      }
      toast.success(t("tplDeleted"))
      setDeleteTarget(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("tplDeleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  function addButton() {
    if (form.buttons.length >= 3) return
    patch({ buttons: [...form.buttons, { type: "QUICK_REPLY", text: "" }] })
  }

  function updateButton(index: number, next: ButtonInput) {
    patch({ buttons: form.buttons.map((b, i) => (i === index ? next : b)) })
  }

  function removeButton(index: number) {
    patch({ buttons: form.buttons.filter((_, i) => i !== index) })
  }

  const bodyOf = (row: TemplateRow) =>
    typeof findComponent(row.components, "BODY")?.text === "string"
      ? (findComponent(row.components, "BODY")!.text as string)
      : ""

  return (
    <div className="flex-1 overflow-y-auto">
    <ContentWrapper>
      <PageHeader
        variant="hero"
        title={t("templatesManagerTitle")}
        description={t("templatesManagerDescription")}
        breadcrumbs={[
          { label: t("title"), href: `/admin/business/${businessId}/integrations` },
          { label: t("manageTemplates") },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={sync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t("syncTemplates")}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("newTemplate")}
            </Button>
          </div>
        }
      />

      <Link
        href={`/admin/business/${businessId}/integrations`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("title")}
      </Link>

      {loading ? (
        <div className="mt-8 flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 py-16 text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("tplEmptyTitle")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{t("tplEmptyBody")}</p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("newTemplate")}
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          {templates.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                      {row.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${statusBadgeClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {row.category} · {row.language}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {bodyOf(row)}
                  </p>
                  {row.rejectionReason &&
                    row.rejectionReason.toUpperCase() !== "NONE" && (
                      <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                        {t("tplRejectedReason", { reason: row.rejectionReason })}
                      </p>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(row)}
                    disabled={row.status.toUpperCase() === "PENDING"}
                    title={
                      row.status.toUpperCase() === "PENDING"
                        ? t("tplEditPendingBlocked")
                        : undefined
                    }
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(row)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="max-w-lg! w-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 p-0 flex flex-col"
        >
          <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
            <SheetTitle className="text-zinc-900 dark:text-white text-base">
              {editing ? t("editTemplate") : t("newTemplate")}
            </SheetTitle>
            <SheetDescription className="text-zinc-500 text-xs">
              {t("tplFormHint")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500">
                  {t("tplName")}
                </Label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    patch({
                      name: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  disabled={!!editing}
                  placeholder="order_update"
                  className={`${INPUT} mt-1.5`}
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500">
                  {t("tplLanguage")}
                </Label>
                <select
                  value={form.language}
                  onChange={(e) => patch({ language: e.target.value })}
                  disabled={!!editing}
                  className={`${INPUT} mt-1.5 appearance-none cursor-pointer`}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500">
                {t("tplCategory")}
              </Label>
              <select
                value={form.category}
                onChange={(e) =>
                  patch({ category: e.target.value as "MARKETING" | "UTILITY" })
                }
                className={`${INPUT} mt-1.5 appearance-none cursor-pointer`}
              >
                <option value="MARKETING">{t("tplCategoryMarketing")}</option>
                <option value="UTILITY">{t("tplCategoryUtility")}</option>
              </select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500">
                {t("tplHeader")}
              </Label>
              <input
                value={form.headerText}
                onChange={(e) => patch({ headerText: e.target.value })}
                placeholder={t("tplHeaderPlaceholder")}
                maxLength={60}
                className={`${INPUT} mt-1.5`}
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500">
                {t("tplBody")}
              </Label>
              <textarea
                value={form.body}
                onChange={(e) => patch({ body: e.target.value })}
                rows={5}
                maxLength={1024}
                placeholder={t("tplBodyPlaceholder")}
                className={`${INPUT} mt-1.5 resize-none`}
              />
              <p className="mt-1 text-[10px] text-zinc-500">{t("tplBodyHint")}</p>
            </div>

            {variableCount > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">
                  {t("tplExamples")}
                </p>
                <div className="space-y-2">
                  {form.bodyExamples.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 tabular-nums w-8">
                        {`{{${i + 1}}}`}
                      </span>
                      <input
                        value={ex}
                        onChange={(e) => {
                          const next = [...form.bodyExamples]
                          next[i] = e.target.value
                          patch({ bodyExamples: next })
                        }}
                        placeholder={t("tplExamplePlaceholder")}
                        className={INPUT}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500">
                {t("tplFooter")}
              </Label>
              <input
                value={form.footerText}
                onChange={(e) => patch({ footerText: e.target.value })}
                placeholder={t("tplFooterPlaceholder")}
                maxLength={60}
                className={`${INPUT} mt-1.5`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">
                  {t("tplButtons")}
                </Label>
                {form.buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={addButton}
                    className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    {t("tplAddButton")}
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {form.buttons.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={b.type}
                        onChange={(e) => {
                          const type = e.target.value as ButtonInput["type"]
                          updateButton(
                            i,
                            type === "URL"
                              ? { type, text: b.text, url: "" }
                              : type === "PHONE_NUMBER"
                                ? { type, text: b.text, phoneNumber: "" }
                                : { type, text: b.text },
                          )
                        }}
                        className={`${INPUT} appearance-none cursor-pointer py-1.5`}
                      >
                        <option value="QUICK_REPLY">{t("tplBtnQuickReply")}</option>
                        <option value="URL">{t("tplBtnUrl")}</option>
                        <option value="PHONE_NUMBER">{t("tplBtnPhone")}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeButton(i)}
                        className="shrink-0 p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={t("tplRemoveButton")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      value={b.text}
                      onChange={(e) =>
                        updateButton(i, { ...b, text: e.target.value })
                      }
                      placeholder={t("tplButtonLabel")}
                      maxLength={25}
                      className={`${INPUT} py-1.5`}
                    />
                    {b.type === "URL" && (
                      <input
                        value={b.url}
                        onChange={(e) =>
                          updateButton(i, { ...b, url: e.target.value })
                        }
                        placeholder="https://example.com/order"
                        className={`${INPUT} py-1.5`}
                      />
                    )}
                    {b.type === "PHONE_NUMBER" && (
                      <input
                        value={b.phoneNumber}
                        onChange={(e) =>
                          updateButton(i, { ...b, phoneNumber: e.target.value })
                        }
                        placeholder="+15551234567"
                        className={`${INPUT} py-1.5`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? t("tplResubmit") : t("tplSubmit")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tplDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tplDeleteBody", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentWrapper>
    </div>
  )
}
