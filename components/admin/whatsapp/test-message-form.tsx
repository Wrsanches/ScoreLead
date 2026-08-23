"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Loader2, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParameter,
} from "@/lib/db/schema"
import {
  getTemplateVariables,
  renderTemplatePreview,
} from "@/lib/whatsapp/templates"

type TestTemplate = {
  id: string
  name: string
  language: string
  components: WhatsAppTemplateComponent[]
}

const SELECT_CLASS =
  "mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 sm:text-sm"

function templateExamples(template: TestTemplate): string[] {
  const body = template.components.find(
    (component) => component.type.toUpperCase() === "BODY",
  )
  const rows = body?.example?.body_text
  if (!Array.isArray(rows) || !Array.isArray(rows[0])) return []
  return rows[0].map((value) => String(value))
}

function initialValues(template: TestTemplate): string[] {
  const variables = getTemplateVariables(template.components)
  const examples = templateExamples(template)
  return variables.map((_, index) => examples[index] ?? "")
}

export function WhatsAppTestMessageForm({ businessId }: { businessId: string }) {
  const t = useTranslations("whatsapp")
  const [templates, setTemplates] = useState<TestTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [phoneE164, setPhoneE164] = useState("")
  const [values, setValues] = useState<string[]>([])
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadTemplates() {
      setLoading(true)
      setLoadError(null)
      try {
        const response = await fetch(
          `/api/businesses/${businessId}/whatsapp/templates`,
          { signal: controller.signal },
        )
        const body = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(body?.error ?? t("testLoadError"))
        }
        const nextTemplates = (body?.templates ?? []) as TestTemplate[]
        setTemplates(nextTemplates)
        const first = nextTemplates[0]
        if (first) {
          setSelectedTemplateId(first.id)
          setValues(initialValues(first))
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setLoadError(error instanceof Error ? error.message : t("testLoadError"))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadTemplates()
    return () => controller.abort()
  }, [businessId, t])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  )
  const variables = useMemo(
    () => selectedTemplate ? getTemplateVariables(selectedTemplate.components) : [],
    [selectedTemplate],
  )
  const preview = useMemo(() => {
    if (!selectedTemplate) return ""
    const parameters: WhatsAppTemplateParameter[] = variables.map((variable, index) => ({
      type: "text",
      ...(/^\d+$/.test(variable) ? {} : { parameterName: variable }),
      text: values[index]?.trim() || `{{${variable}}}`,
    }))
    return renderTemplatePreview(selectedTemplate.components, parameters)
  }, [selectedTemplate, values, variables])

  function chooseTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    const template = templates.find((item) => item.id === templateId)
    setValues(template ? initialValues(template) : [])
    setResult(null)
  }

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTemplate || sending) return

    setSending(true)
    setResult(null)
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/whatsapp/test-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneE164,
            templateId: selectedTemplate.id,
            values,
            consentConfirmed,
          }),
        },
      )
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.error ?? t("testSendError"))
      }
      setResult(t("testSentStatus"))
      toast.success(t("testSentToast"))
    } catch (error) {
      const message = error instanceof Error ? error.message : t("testSendError")
      setResult(message)
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      className="border-t border-zinc-200 pt-8 dark:border-zinc-800"
      aria-labelledby="whatsapp-test-title"
    >
      <div className="max-w-2xl">
        <h2 id="whatsapp-test-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {t("testTitle")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {t("testDescription")}
        </p>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("testLoadingTemplates")}
        </div>
      ) : loadError ? (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      ) : templates.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">{t("testNoTemplates")}</p>
      ) : (
        <form className="mt-6 max-w-2xl space-y-5" onSubmit={sendTest}>
          <div>
            <Label htmlFor="wa-test-phone">{t("testRecipient")}</Label>
            <Input
              id="wa-test-phone"
              name="recipientPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              required
              pattern="\+[1-9]\d{7,14}"
              maxLength={16}
              className="mt-2 text-base sm:text-sm"
              value={phoneE164}
              onChange={(event) => {
                setPhoneE164(event.target.value)
                setResult(null)
              }}
              aria-describedby="wa-test-phone-help"
              placeholder="+5511999999999"
            />
            <p id="wa-test-phone-help" className="mt-1.5 text-xs text-zinc-500">
              {t("testRecipientHelp")}
            </p>
          </div>

          <div>
            <Label htmlFor="wa-test-template">{t("testTemplate")}</Label>
            <select
              id="wa-test-template"
              name="templateId"
              required
              className={SELECT_CLASS}
              value={selectedTemplateId}
              onChange={(event) => chooseTemplate(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} · {template.language}
                </option>
              ))}
            </select>
          </div>

          {variables.length > 0 && (
            <fieldset className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <legend className="px-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("testVariables")}
              </legend>
              {variables.map((variable, index) => (
                <div key={`${variable}-${index}`}>
                  <Label htmlFor={`wa-test-variable-${index}`}>
                    {t("testVariableLabel", { variable: `{{${variable}}}` })}
                  </Label>
                  <Input
                    id={`wa-test-variable-${index}`}
                    name={`variable-${index}`}
                    required
                    maxLength={200}
                    className="mt-2 text-base sm:text-sm"
                    value={values[index] ?? ""}
                    onChange={(event) => {
                      const next = [...values]
                      next[index] = event.target.value
                      setValues(next)
                      setResult(null)
                    }}
                  />
                </div>
              ))}
            </fieldset>
          )}

          {preview && (
            <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("testPreview")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {preview}
              </p>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-4 text-sm leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
            <input
              name="consentConfirmed"
              type="checkbox"
              required
              checked={consentConfirmed}
              onChange={(event) => {
                setConsentConfirmed(event.target.checked)
                setResult(null)
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
            />
            <span>{t("testConsentConfirmation")}</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {sending ? t("testSending") : t("testSendButton")}
            </Button>
            <p className="text-xs leading-5 text-zinc-500">{t("testImmediateNotice")}</p>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            {result}
          </p>
        </form>
      )}
    </section>
  )
}
