"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Monitor, Smartphone, LogOut } from "lucide-react"

type SessionRow = {
  id: string
  token: string
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: string | Date
}

function makeSchema(t: (k: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, t("passwordTooShort")),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      path: ["confirmPassword"],
      message: t("passwordMismatch"),
    })
}

type PasswordValues = z.infer<ReturnType<typeof makeSchema>>

export function SecuritySection() {
  const t = useTranslations("settings")
  const { data: currentSession } = authClient.useSession()

  const form = useForm<PasswordValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onChangePassword(values: PasswordValues) {
    try {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: false,
      })
      if (result.error) {
        toast.error(t("passwordChangeFailed"), {
          description: result.error.message,
        })
        return
      }
      toast.success(t("passwordChanged"))
      form.reset()
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined
      toast.error(t("passwordChangeFailed"), { description: message })
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-5">
          {t("changePassword")}
        </h2>

        <form
          onSubmit={form.handleSubmit(onChangePassword)}
          className="space-y-4 max-w-md"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-zinc-700 dark:text-zinc-300">
              {t("currentPassword")}
            </Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              className="bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              {...form.register("currentPassword")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-zinc-700 dark:text-zinc-300">
              {t("newPassword")}
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-zinc-700 dark:text-zinc-300">
              {t("confirmPassword")}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="pt-1">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {form.formState.isSubmitting ? t("saving") : t("changePassword")}
            </Button>
          </div>
        </form>
      </section>

      <ActiveSessions currentSessionId={currentSession?.session?.id} />
    </div>
  )
}

function ActiveSessions({ currentSessionId }: { currentSessionId?: string }) {
  const t = useTranslations("settings")
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  async function load() {
    try {
      const res = await authClient.listSessions()
      const data = (res.data ?? []) as unknown as SessionRow[]
      setSessions(data)
    } catch {
      setSessions([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRevoke(token: string) {
    setRevoking(token)
    try {
      await authClient.revokeSession({ token })
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined
      toast.error(t("saveFailed"), { description: message })
    } finally {
      setRevoking(null)
    }
  }

  async function handleRevokeAllOthers() {
    setRevokingAll(true)
    try {
      await authClient.revokeOtherSessions()
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined
      toast.error(t("saveFailed"), { description: message })
    } finally {
      setRevokingAll(false)
    }
  }

  const otherSessionsCount = sessions
    ? sessions.filter((s) => s.id !== currentSessionId).length
    : 0

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
            {t("activeSessions")}
          </h2>
          <p className="text-sm text-zinc-500">
            {t("activeSessionsDescription")}
          </p>
        </div>
        {otherSessionsCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={revokingAll}
            onClick={handleRevokeAllOthers}
          >
            {revokingAll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t("signOutEverywhere")}
          </Button>
        )}
      </div>

      {sessions === null ? (
        <div className="text-sm text-zinc-500">...</div>
      ) : sessions.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("noOtherSessions")}</div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSessionId
            const Icon = /Mobile|Android|iPhone/i.test(s.userAgent ?? "")
              ? Smartphone
              : Monitor
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/30"
              >
                <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate">
                    {s.userAgent ?? "Unknown device"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {s.ipAddress ?? "-"} - {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                {isCurrent ? (
                  <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 shrink-0">
                    {t("currentSession")}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={revoking === s.token}
                    onClick={() => handleRevoke(s.token)}
                    className="shrink-0 text-zinc-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    {revoking === s.token ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    {t("revokeSession")}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
