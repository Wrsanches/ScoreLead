"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle } from "lucide-react"

export function DangerZoneSection() {
  const t = useTranslations("settings")
  const locale = useLocale()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const userEmail = session?.user?.email ?? ""
  const canConfirm =
    userEmail.length > 0 &&
    confirmInput.trim().toLowerCase() === userEmail.toLowerCase()

  async function handleDelete() {
    if (!canConfirm || submitting) return
    setSubmitting(true)
    try {
      const result = await authClient.deleteUser()
      if (result?.error) {
        toast.error(t("deleteAccountFailed"), {
          description: result.error.message,
        })
        return
      }
      await authClient.signOut().catch(() => {})
      router.replace("/login", { locale: locale as "en" | "pt" | "es" })
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined
      toast.error(t("deleteAccountFailed"), { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
            {t("deleteAccount")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg">
            {t("deleteAccountDescription")}
          </p>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">{t("deleteAccountButton")}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteAccountConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteAccountConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="confirm-email" className="text-zinc-700 dark:text-zinc-300">
              {userEmail}
            </Label>
            <Input
              id="confirm-email"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={t("deleteAccountConfirmPlaceholder")}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t("deleteAccountCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!canConfirm || submitting}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("deleteAccountConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
