"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Send, WandSparkles } from "lucide-react"
import { arrayMove } from "@dnd-kit/sortable"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EMAIL_HTML_MAX_BYTES, EMAIL_SUBJECT_MAX, type EmailContext, type EmailVariableKey, type RenderedEmail } from "@/lib/resend/render"
import { createBlock, createEmptyDocument, emailDocumentSchema, newBlockId, type EmailBlock, type EmailBlockKind, type EmailComponentKind, type EmailComponentSet, type EmailDocument } from "@/lib/resend/blocks"
import { emailTemplateFormSchema, type EmailBodyMode, type EmailTemplateFormInput } from "@/lib/resend/template-form"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import type { ProductImage } from "@/lib/product-images"
import { VariableMenu } from "./variable-menu"
import { SharedComponentDialog } from "./shared-component-dialog"
import { SharedComponentsAiDialog } from "./shared-components-ai-dialog"
import { BlockPalette } from "./builder/block-palette"
import { BlocksCanvas } from "./builder/blocks-canvas"
import { BlockInspector } from "./builder/block-inspector"
import { AiGenerateDialog, type AiDraft } from "./builder/ai-generate-dialog"
import { readJson, resendErrorMessage } from "./errors"
import { HtmlCodeEditor, type HtmlCodeEditorHandle } from "./html-code-editor"

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

export type EmailTemplateEditorHandle = { submit: () => void; openTestSend: () => void }

export type EditorInitial = {
  name: string
  subject: string
  bodyMode: string
  bodyDoc: EmailDocument | null
  bodyHtml: string
} | null

type Preview = RenderedEmail | null

const TEST_EMAIL_KEY = "scorelead:resend:test-email"

/**
 * The template editor: name, subject, and a body that is either a block
 * document (builder) or raw HTML. The header owns Save; this exposes submit().
 */
export const EmailTemplateEditor = forwardRef<
  EmailTemplateEditorHandle,
  {
    businessId: string
    initial: EditorInitial
    saving: boolean
    readOnly?: boolean
    components: EmailComponentSet
    theme: BrandTheme
    logoFallback?: string | null
    productImages?: ProductImage[]
    languageLabel: string
    previewContext?: EmailContext
    onComponentsChanged: (components: EmailComponentSet) => void
    onSave: (input: EmailTemplateFormInput) => void
  }
>(function EmailTemplateEditor(
  { businessId, initial, saving, readOnly = false, components, theme, logoFallback, productImages = [], languageLabel, previewContext, onComponentsChanged, onSave },
  ref,
) {
  const t = useTranslations("resend")
  const [name, setName] = useState(initial?.name ?? "")
  const [subject, setSubject] = useState(initial?.subject ?? "")
  const [mode, setMode] = useState<EmailBodyMode>(initial?.bodyMode === "html" ? "html" : "blocks")
  const [doc, setDoc] = useState<EmailDocument>(() => {
    const parsed = emailDocumentSchema.safeParse(initial?.bodyDoc)
    return parsed.success ? parsed.data : createEmptyDocument()
  })
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyMode === "html" ? initial.bodyHtml : "")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aside, setAside] = useState<"preview" | "settings">("preview")
  const [errors, setErrors] = useState<string[]>([])
  const [toHtmlOpen, setToHtmlOpen] = useState(false)
  const [toBlocksOpen, setToBlocksOpen] = useState(false)
  const [sharedKind, setSharedKind] = useState<EmailComponentKind | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiComponentsOpen, setAiComponentsOpen] = useState(false)
  const subjectRef = useRef<HTMLInputElement>(null)
  const htmlRef = useRef<HtmlCodeEditorHandle>(null)
  const [formatting, setFormatting] = useState(false)

  // ---- preview: always server-rendered so both modes show the real business and sender
  const [preview, setPreview] = useState<Preview>(null)
  const [previewing, setPreviewing] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const handle = setTimeout(async () => {
      setPreviewing(true)
      try {
        const response = await fetch(`/api/businesses/${businessId}/resend/templates/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mode === "blocks" ? { subject, bodyMode: "blocks", bodyDoc: doc } : { subject, bodyMode: "html", bodyHtml }),
          signal: controller.signal,
        })
        const body = await readJson<RenderedEmail>(response)
        if (response.ok && body) setPreview(body)
      } catch {
        /* aborted or offline; keep the last preview */
      } finally {
        if (!controller.signal.aborted) setPreviewing(false)
      }
    }, 400)
    return () => {
      clearTimeout(handle)
      controller.abort()
    }
    // The preview depends on the shared components too; they are read live on the server.
  }, [mode, subject, bodyHtml, doc, businessId, components])

  // ---- document operations
  const selected = useMemo(() => doc.blocks.find((b) => b.id === selectedId) ?? null, [doc.blocks, selectedId])
  const patchDoc = useCallback((patch: Partial<EmailDocument>) => setDoc((d) => ({ ...d, ...patch })), [])
  function addBlock(kind: EmailBlockKind) {
    const block = createBlock(kind)
    setDoc((d) => {
      const at = selectedId ? d.blocks.findIndex((b) => b.id === selectedId) : -1
      const blocks = [...d.blocks]
      blocks.splice(at >= 0 ? at + 1 : blocks.length, 0, block)
      return { ...d, blocks }
    })
    setSelectedId(block.id)
    setAside("settings")
  }
  const updateBlock = useCallback((block: EmailBlock) => setDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === block.id ? block : b)) })), [])
  function moveBlock(id: string, delta: -1 | 1) {
    setDoc((d) => {
      const from = d.blocks.findIndex((b) => b.id === id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= d.blocks.length) return d
      return { ...d, blocks: arrayMove(d.blocks, from, to) }
    })
  }
  function duplicateBlock(id: string) {
    setDoc((d) => {
      const index = d.blocks.findIndex((b) => b.id === id)
      if (index < 0) return d
      const copy = { ...d.blocks[index], id: newBlockId(), props: structuredClone(d.blocks[index].props) } as EmailBlock
      const blocks = [...d.blocks]
      blocks.splice(index + 1, 0, copy)
      setSelectedId(copy.id)
      return { ...d, blocks }
    })
  }
  function removeBlock(id: string) {
    setDoc((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }))
    setSelectedId((s) => (s === id ? null : s))
  }

  function insertIntoSubject(key: EmailVariableKey) {
    const el = subjectRef.current
    const token = `{{${key}}}`
    const start = el?.selectionStart ?? subject.length
    const end = el?.selectionEnd ?? subject.length
    setSubject(subject.slice(0, start) + token + subject.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }
  function insertIntoHtml(key: EmailVariableKey) {
    htmlRef.current?.insertAtCursor(`{{${key}}}`)
  }

  /** Prettier runs in the browser, loaded on first use; tokens survive as plain text. */
  async function formatHtml() {
    if (!bodyHtml.trim()) return
    setFormatting(true)
    try {
      const [{ default: prettier }, { default: htmlPlugin }] = await Promise.all([import("prettier/standalone"), import("prettier/plugins/html")])
      const formatted = await prettier.format(bodyHtml, { parser: "html", plugins: [htmlPlugin], printWidth: 100, htmlWhitespaceSensitivity: "ignore" })
      setBodyHtml(formatted.replace(/\n$/, ""))
    } catch {
      toast.error(t("tplHtmlFormatFailed"))
    } finally {
      setFormatting(false)
    }
  }

  // ---- mode switching
  async function switchToHtml() {
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/templates/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyMode: "blocks", bodyDoc: doc, tokens: true }),
      })
      const body = await readJson<RenderedEmail>(response)
      setBodyHtml(response.ok && body ? body.html : "")
    } catch {
      setBodyHtml("")
    }
    setMode("html")
    setToHtmlOpen(false)
  }
  /** The block document is kept while in HTML mode, so coming back restores it. */
  function switchToBlocks() {
    setSelectedId(null)
    setMode("blocks")
    setToBlocksOpen(false)
  }
  const hasBlocks = doc.blocks.length > 0

  function applyDraft(draft: AiDraft, proposed: EmailComponentSet | null) {
    setDoc(draft.doc)
    setSubject(draft.subject)
    setSelectedId(null)
    if (!name.trim()) setName(draft.name)
    if (proposed) {
      void fetch(`/api/businesses/${businessId}/resend/components`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header: proposed.header ?? undefined, footer: proposed.footer ?? undefined }),
      })
        .then((r) => readJson<{ components?: EmailComponentSet }>(r))
        .then((body) => body?.components && onComponentsChanged(body.components))
    }
  }

  // ---- submit
  function submit() {
    const input: EmailTemplateFormInput = {
      name: name.trim(),
      subject: subject.trim(),
      bodyMode: mode,
      bodyDoc: mode === "blocks" ? doc : null,
      bodyHtml: mode === "html" ? bodyHtml : undefined,
    }
    const parsed = emailTemplateFormSchema.safeParse(input)
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => {
        const [code, detail] = issue.message.includes(":") ? [issue.message.slice(0, issue.message.indexOf(":")), issue.message.slice(issue.message.indexOf(":") + 1)] : [issue.message, ""]
        switch (code) {
          case "UNKNOWN_VARIABLE":
            return t("tplUnknownVariables", { names: detail.split(",").join(", ") })
          case "BLOCK_INCOMPLETE": {
            const first = detail.split(",")[0]
            if (first) {
              setSelectedId(first)
              setAside("settings")
            }
            return t("tplBlockIncomplete")
          }
          case "BLOCKS_EMPTY":
          case "BLOCKS_BODY_REQUIRED":
            return t("tplBlocksRequired")
          case "DOC_TOO_LARGE":
            return t("tplDocTooLarge")
          case "HTML_BODY_REQUIRED":
            return t("tplBodyRequired")
          default: {
            const field = String(issue.path[0] ?? "")
            if (field === "name") return t("tplNameRequired")
            if (field === "subject") return t("tplSubjectRequired")
            return issue.message
          }
        }
      })
      setErrors([...new Set(messages)])
      return
    }
    if (preview && preview.bytes > EMAIL_HTML_MAX_BYTES) {
      setErrors([t("tplTooLarge")])
      return
    }
    setErrors([])
    onSave(parsed.data)
  }
  const tooLarge = !!preview && preview.bytes > EMAIL_HTML_MAX_BYTES

  // ---- test send: the current draft, to an address the user types, with the sample lead
  const [testOpen, setTestOpen] = useState(false)
  const [testTo, setTestTo] = useState("")
  const [testSending, setTestSending] = useState(false)
  useEffect(() => {
    try {
      setTestTo(window.localStorage.getItem(TEST_EMAIL_KEY) ?? "")
    } catch {
      /* storage unavailable */
    }
  }, [])
  const testAddressValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo.trim())
  const canSendTest = !readOnly && !saving && !testSending && !tooLarge && !!subject.trim() && testAddressValid
  useImperativeHandle(ref, () => ({ submit, openTestSend: () => setTestOpen(true) }))
  const sendTest = async () => {
    if (!canSendTest) return
    const to = testTo.trim().toLowerCase()
    setTestSending(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/templates/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "blocks" ? { to, subject, bodyMode: "blocks", bodyDoc: doc } : { to, subject, bodyMode: "html", bodyHtml }),
      })
      const body = await readJson<{ error?: string; code?: string }>(response)
      if (!response.ok) {
        toast.error(resendErrorMessage(t, body, "tplTestError"))
        return
      }
      try {
        window.localStorage.setItem(TEST_EMAIL_KEY, to)
      } catch {
        /* storage unavailable */
      }
      toast.success(t("tplTestSent", { to }))
      setTestOpen(false)
    } catch {
      toast.error(t("tplTestError"))
    } finally {
      setTestSending(false)
    }
  }
  const sizeLabel = preview ? `${(preview.bytes / 1024).toFixed(1)} KB / ${Math.round(EMAIL_HTML_MAX_BYTES / 1024)} KB` : ""

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="space-y-2">
            <div className="flex h-8 items-center">
              <Label htmlFor="tpl-name" className="text-xs uppercase tracking-wider text-zinc-500">{t("tplName")}</Label>
            </div>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} maxLength={120} disabled={saving || readOnly} placeholder={t("tplNamePlaceholder")} />
          </div>
          <div className="space-y-2">
            <div className="flex h-8 items-center justify-between gap-2">
              <Label htmlFor="tpl-subject" className="text-xs uppercase tracking-wider text-zinc-500">{t("tplSubject")}</Label>
              <VariableMenu onPick={insertIntoSubject} label={t("tplInsertVariable")} disabled={saving || readOnly} />
            </div>
            <Input id="tpl-subject" ref={subjectRef} value={subject} onChange={(e) => setSubject(e.target.value)} className={INPUT} maxLength={EMAIL_SUBJECT_MAX} disabled={saving || readOnly} placeholder={t("tplSubjectPlaceholder")} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-wider text-zinc-500">{t("tplBody")}</Label>
            <Tabs
              value={mode}
              onValueChange={(next) => {
                if (next === "html") {
                  if (hasBlocks) setToHtmlOpen(true)
                  else setMode("html")
                } else if (bodyHtml.trim()) setToBlocksOpen(true)
                else switchToBlocks()
              }}
            >
              <TabsList className="h-8">
                <TabsTrigger value="blocks" className="text-xs" disabled={readOnly}>{t("tplModeEditor")}</TabsTrigger>
                <TabsTrigger value="html" className="text-xs" disabled={readOnly}>{t("tplModeHtml")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {mode === "blocks" ? (
            <>
              {!readOnly && <BlockPalette onAdd={addBlock} onGenerate={() => setAiOpen(true)} disabled={saving} />}
              <BlocksCanvas
                doc={doc}
                components={components}
                theme={theme}
                selectedId={selectedId}
                readOnly={readOnly || saving}
                onSelect={(id) => {
                  setSelectedId(id)
                  if (id) setAside("settings")
                }}
                onUpdateBlock={updateBlock}
                onReorder={(from, to) => setDoc((d) => ({ ...d, blocks: arrayMove(d.blocks, from, to) }))}
                onMove={moveBlock}
                onDuplicate={duplicateBlock}
                onRemove={removeBlock}
                onToggleShared={(kind, enabled) => patchDoc({ shared: { ...doc.shared, [kind]: enabled } })}
                onEditShared={(kind) => setSharedKind(kind)}
                onGenerate={readOnly ? undefined : () => setAiOpen(true)}
                previewContext={previewContext}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void formatHtml()} disabled={saving || readOnly || formatting || !bodyHtml.trim()} className="gap-1.5">
                  {formatting ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}
                  {t("tplHtmlFormat")}
                </Button>
                <VariableMenu onPick={insertIntoHtml} label={t("tplInsertVariable")} disabled={saving || readOnly} />
              </div>
              <HtmlCodeEditor ref={htmlRef} value={bodyHtml} onChange={setBodyHtml} readOnly={saving || readOnly} placeholder="<p>Hi {{lead.firstName}},</p>" />
              <p className="text-xs leading-5 text-zinc-500">{t("tplHtmlHint")}</p>
            </>
          )}
        </div>

        {errors.length > 0 && (
          <ul role="alert" className="space-y-1 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errors.map((message) => <li key={message}>{message}</li>)}
          </ul>
        )}
      </div>

      <aside className="glass-card min-w-0 rounded-2xl p-5 lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center justify-between gap-2">
          {mode === "blocks" ? (
            <Tabs value={aside} onValueChange={(v) => setAside(v as "preview" | "settings")}>
              <TabsList className="h-8">
                <TabsTrigger value="preview" className="text-xs">{t("tplPreview")}</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">{t("inspectorTitle")}</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("tplPreview")}</p>
          )}
          <span className={`font-mono text-[11px] ${tooLarge ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>{previewing ? "…" : sizeLabel}</span>
        </div>

        {mode === "blocks" && aside === "settings" ? (
          <BlockInspector businessId={businessId} logo={logoFallback ?? null} productImages={productImages} doc={doc} block={selected} components={components} readOnly={readOnly || saving} onUpdateBlock={updateBlock} onDocChange={patchDoc} onEditShared={(kind) => setSharedKind(kind)} onGenerateShared={() => setAiComponentsOpen(true)} />
        ) : (
          <>
            <p className="mb-3 truncate text-sm text-zinc-800 dark:text-zinc-200">
              <span className="text-zinc-500">{t("tplSubject")}: </span>
              {preview?.subject || <span className="italic text-zinc-400">{t("tplSubjectEmpty")}</span>}
            </p>
            <iframe title={t("tplPreview")} sandbox="" srcDoc={preview?.html ?? ""} className="h-[560px] w-full rounded-xl border border-zinc-200 bg-white dark:border-white/[0.08]" />
            {preview && preview.unknownVariables.length > 0 && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">{t("tplUnknownVariables", { names: preview.unknownVariables.join(", ") })}</p>
            )}
            <p className="mt-3 text-xs leading-5 text-zinc-500">{t("tplPreviewSample")}</p>
          </>
        )}
      </aside>

      <Dialog open={testOpen} onOpenChange={(open) => !testSending && setTestOpen(open)}>
        <DialogContent className="max-w-md! rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-0 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendTest()
            }}
          >
            <DialogHeader className="border-b border-white/[0.08] px-6 py-4">
              <DialogTitle>{t("tplTestTitle")}</DialogTitle>
              <DialogDescription>{t("tplTestHint")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 px-6 py-5">
              <Label htmlFor="tpl-test-to" className="text-xs uppercase tracking-wider text-zinc-500">{t("tplTestEmailLabel")}</Label>
              <Input id="tpl-test-to" type="email" inputMode="email" autoComplete="email" autoFocus value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={t("tplTestEmailPlaceholder")} className={INPUT} disabled={testSending} />
              {!subject.trim() && <p className="text-xs text-amber-400">{t("tplTestNeedsSubject")}</p>}
            </div>
            <DialogFooter className="border-t border-white/[0.08] px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setTestOpen(false)} disabled={testSending}>{t("cancel")}</Button>
              <Button type="submit" disabled={!canSendTest} className="gap-1.5">
                {testSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {testSending ? t("tplTestSending") : t("tplTestSend")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toHtmlOpen} onOpenChange={setToHtmlOpen}>
        <AlertDialogContent className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tplToHtmlTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("tplToHtmlBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void switchToHtml() }}>{t("tplModeHtml")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={toBlocksOpen} onOpenChange={setToBlocksOpen}>
        <AlertDialogContent className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] text-zinc-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tplBackToEditorTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("tplBackToEditorBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={switchToBlocks}>{t("tplBackToEditorConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {sharedKind && (
        <SharedComponentDialog
          businessId={businessId}
          kind={sharedKind}
          open
          onOpenChange={(open) => !open && setSharedKind(null)}
          components={components}
          theme={theme}
          logoFallback={logoFallback}
          previewContext={previewContext}
          onSaved={onComponentsChanged}
        />
      )}
      <SharedComponentsAiDialog
        businessId={businessId}
        open={aiComponentsOpen}
        onOpenChange={setAiComponentsOpen}
        theme={theme}
        previewContext={previewContext}
        onSaved={onComponentsChanged}
      />
      <AiGenerateDialog
        businessId={businessId}
        open={aiOpen}
        onOpenChange={setAiOpen}
        hasContent={doc.blocks.length > 0}
        languageLabel={languageLabel}
        onApply={applyDraft}
      />
    </div>
  )
})
