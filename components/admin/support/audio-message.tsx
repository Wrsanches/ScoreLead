"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { supportRequest } from "@/components/admin/support/request"
import type { SupportMessageView } from "@/lib/support/contracts"

export function AudioMessage({ message, endpoint, readOnly, processing, onSaved }: {
  message: SupportMessageView; endpoint: string; readOnly: boolean; processing: boolean; onSaved: () => Promise<void>
}) {
  const t = useTranslations("supportInbox")
  const { setDirty } = useIntegrationNavigation()
  const [editing, setEditing] = useState(false)
  const [transcript, setTranscript] = useState(message.transcript ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)
  useEffect(() => () => setDirty(`audio:${message.id}`, false), [message.id, setDirty])

  async function save() {
    if (busy || !transcript.trim()) return
    setBusy(true); setError(false)
    try {
      await supportRequest(`${endpoint}/messages/${message.id}`, { method: "PATCH", body: JSON.stringify({ transcript }) })
      setDirty(`audio:${message.id}`, false); setEditing(false); await onSaved()
    } catch { setError(true) } finally { setBusy(false) }
  }

  return (
    <div className="min-w-64 space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Mic className="size-3.5" aria-hidden />{message.isVoiceNote ? t("voiceNote") : t("audio")}</p>
      {message.hasAudio && <audio aria-label={t("listenAudio")} controls preload="none" className="h-10 w-full max-w-full" src={`${endpoint}/messages/${message.id}`} onError={() => setPlaybackError(true)}><track kind="captions" /></audio>}
      {playbackError && <p role="alert" className="text-xs leading-5 text-amber-700 dark:text-amber-300">{t("audioUnavailable")}</p>}
      {!editing && (message.transcript
        ? <p className="whitespace-pre-wrap break-words border-l-2 border-zinc-300 pl-3 text-sm leading-6 text-zinc-800 dark:border-white/[0.12] dark:text-zinc-200">{message.transcript}</p>
        : <p className="text-xs leading-5 text-zinc-500">{message.transcriptionError ? t("transcriptionFailed") : message.hasAudio ? t("transcriptionPending") : t("audioUnavailable")}</p>)}
      {!readOnly && !editing && <Button variant="ghost" size="sm" className="-ml-2.5 h-7 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white" disabled={processing} onClick={() => { setTranscript(message.transcript ?? ""); setEditing(true) }}>{message.transcript ? t("editTranscript") : t("addTranscript")}</Button>}
      {editing && (
        <div className="space-y-2">
          <Label htmlFor={`transcript-${message.id}`}>{t("transcriptLabel")}</Label>
          <Textarea id={`transcript-${message.id}`} value={transcript} onChange={(event) => { setTranscript(event.target.value); setDirty(`audio:${message.id}`, true) }} maxLength={24000} rows={4} disabled={busy} className="text-sm leading-6" />
          {error && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{t("transcriptSaveError")}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || !transcript.trim()} onClick={() => void save()}>{busy && <Loader2 className="size-3.5 animate-spin" />}{t("saveTranscript")}</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setDirty(`audio:${message.id}`, false); setEditing(false) }}>{t("cancel")}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
