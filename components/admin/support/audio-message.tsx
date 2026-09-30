"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
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
  return <div className="space-y-3">
    <p className="text-xs font-medium text-zinc-500">{message.isVoiceNote ? t("voiceNote") : t("audio")}</p>
    {message.hasAudio && <audio aria-label={t("listenAudio")} controls preload="none" className="h-10 w-full max-w-full" src={`${endpoint}/messages/${message.id}`} onError={() => setPlaybackError(true)}><track kind="captions" /></audio>}
    {playbackError && <p role="alert" className="text-xs leading-5 text-amber-700 dark:text-amber-300">{t("audioUnavailable")}</p>}
    {!editing && (message.transcript ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700 dark:text-zinc-300">{message.transcript}</p> : <p className="text-xs leading-5 text-zinc-500">{message.transcriptionError ? t("transcriptionFailed") : message.hasAudio ? t("transcriptionPending") : t("audioUnavailable")}</p>)}
    {!readOnly && !editing && <Button variant="ghost" className="h-8 cursor-pointer px-0 text-xs" disabled={processing} onClick={() => { setTranscript(message.transcript ?? ""); setEditing(true) }}>{message.transcript ? t("editTranscript") : t("addTranscript")}</Button>}
    {editing && <div className="space-y-2"><Label htmlFor={`transcript-${message.id}`}>{t("transcriptLabel")}</Label><Textarea id={`transcript-${message.id}`} value={transcript} onChange={(event) => { setTranscript(event.target.value); setDirty(`audio:${message.id}`, true) }} maxLength={24000} rows={4} disabled={busy} />
      {error && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{t("transcriptSaveError")}</p>}<div className="flex gap-2"><Button className="cursor-pointer" disabled={busy || !transcript.trim()} onClick={() => void save()}>{busy && <Loader2 className="size-4 animate-spin" />}{t("saveTranscript")}</Button><Button className="cursor-pointer" variant="ghost" disabled={busy} onClick={() => { setDirty(`audio:${message.id}`, false); setEditing(false) }}>{t("cancel")}</Button></div></div>}
  </div>
}
